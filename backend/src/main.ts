import * as dns from 'dns';

// Prefer IPv4 when resolving hostnames so platforms without IPv6 routing (Render) don't try
// to connect via IPv6 and fail with ENETUNREACH. This runs very early (import order) so
// it applies before network connections are attempted by providers like nodemailer.
try {
  if (typeof (dns as any).setDefaultResultOrder === 'function') {
    (dns as any).setDefaultResultOrder('ipv4first');
    /* eslint-disable no-console */
    console.log('dns: setDefaultResultOrder -> ipv4first');
    /* eslint-enable no-console */
  } else {
    /* eslint-disable no-console */
    console.log('dns: setDefaultResultOrder not available on this Node version');
    /* eslint-enable no-console */
  }
} catch (e) {
  // Non-fatal: do not prevent the app from starting if this call fails
  // but log so operators can investigate.
  /* eslint-disable no-console */
  console.warn('Failed to set dns default result order:', e);
  /* eslint-enable no-console */
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Initializes the core application instance and configures global middleware for security, validation, and error handling.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security Headers Middleware
  // Applies standard security headers: XSS protection, no-sniff, no-clickjacking, HSTS, etc.
  app.use(helmet());

  // Cookie Parser Middleware
  // Parses HTTP request cookies and populates req.cookies for cookie-based authentication
  app.use(cookieParser());

  // Cross-Origin Resource Sharing
  // Build an explicit whitelist from CORS_ORIGIN env var (comma-separated for multiple origins).
  // Never use a wildcard with credentials=true.
  const rawOrigin = configService.get<string>('app.cors.origin') ?? '';
  const allowedOrigins = rawOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Explicit origin validator: only allow origins in the whitelist.
  // Requests with no Origin header (e.g. same-origin, curl) are permitted.
  // Requests with an Origin not in the whitelist receive a CORS error.
  const originValidator = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' is not permitted by CORS policy`));
    }
  };

  // Configures CORS to permit secure communication between the frontend client and the clinical backend API.
  // credentials: true is required for cross-origin HttpOnly cookie authentication.
  app.enableCors({
    origin: originValidator,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Global Validation
  // Enforces strict input validation across all endpoints, stripping unknown properties to prevent injection attacks.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter
  // Unifies error responses into a consistent JSON format for easier frontend handling and system-wide monitoring.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Prefix
  // Routes all clinical and administrative API requests under a unified /api namespace.
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  const env = configService.get<string>('app.nodeEnv');

  // Bind to 0.0.0.0 so Render's port scanner can detect the open port.
  // Without the explicit host, Node defaults to 127.0.0.1 (loopback only).
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on port ${port} [${env}]`);
}

bootstrap();