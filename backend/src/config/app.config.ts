import { registerAs } from '@nestjs/config';

// Defines a strongly-typed configuration schema that centralizes environment variables for database, security, and external services.
export const appConfig = registerAs('app', () => {
  // Enforces the presence of critical environment variables to prevent runtime failures due to missing credentials.
  const required = (key: string): string => {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key}. ` +
          `Please add it to your .env file.`,
      );
    }
    return value;
  };

  const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  };

  const jwtExpiration = required('JWT_EXPIRATION');

  return {
    nodeEnv: process.env.NODE_ENV || 'development',

    // Secure Identity Configuration
    jwt: {
      secret: required('JWT_SECRET'),
      expiresIn: jwtExpiration,
      cookieMaxAge: parseDuration(jwtExpiration),
    },

    // Network Security Configuration
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },

    // Persistent Storage Configuration
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: required('DB_USERNAME'),
      password: required('DB_PASSWORD'),
      name: required('DB_NAME'),
    },

    // Federated Identity Configuration
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },

    // Automated Notification Configuration
    mail: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.MAIL_FROM || 'Care Home <noreply@carehome.com>',
      appUrl: process.env.APP_URL || 'http://localhost:5173',
    },
  };
});
