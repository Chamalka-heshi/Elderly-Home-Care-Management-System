import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cs = app.get(ConfigService);

  const rawOrigin = cs.get<string>('app.cors.origin');
  const allowedOrigins = rawOrigin.split(',').map((o) => o.trim());
  const corsOrigin = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global validation ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── API prefix ────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  const env  = cs.get<string>('app.nodeEnv');
  await app.listen(port);
  console.log(` Backend running on http://localhost:${port}/api  [${env}]`);
}
bootstrap();
