import { registerAs } from '@nestjs/config';

/**
 * Typed application configuration.
 *
 * Loaded once at startup via ConfigModule.forRoot({ load: [appConfig] }).
 * Inject with:  @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>
 *
 * All required env vars are validated here — the app will refuse to start
 * rather than silently use an undefined secret.
 */
export const appConfig = registerAs('app', () => {
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

  return {
    nodeEnv: process.env.NODE_ENV || 'development',

    /** JWT — used by JwtModule */
    jwt: {
      secret: required('JWT_SECRET'),
      expiresIn: required('JWT_EXPIRATION'),
    },

    /** CORS — restrict to your front-end origin in production */
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },

    /** PostgreSQL */
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: required('DB_USERNAME'),
      password: required('DB_PASSWORD'),
      name: required('DB_NAME'),
    },

    /** Firebase Admin SDK */
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  };
});
