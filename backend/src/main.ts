import { NestFactory }    from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService }  from '@nestjs/config';

import { AppModule }           from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';


// Initializes the core application instance and configures global middleware for security, validation, and error handling.
async function bootstrap() {
  const app           = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cross-Origin Resource Sharing
  const rawOrigin      = configService.get<string>('app.cors.origin') ?? '';
  const allowedOrigins = rawOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  const corsOrigin     = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins;

  // Configures CORS to permit secure communication between the frontend client and the clinical backend API.
  app.enableCors({
    origin:         corsOrigin,
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation
  // Enforces strict input validation across all endpoints, stripping unknown properties to prevent injection attacks.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
    }),
  );

  // Global Exception Filter
  // Unifies error responses into a consistent JSON format for easier frontend handling and system-wide monitoring.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Prefix
  // Routes all clinical and administrative API requests under a unified /api namespace.
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  const env  = configService.get<string>('app.nodeEnv');

  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api [${env}]`);
}

bootstrap();