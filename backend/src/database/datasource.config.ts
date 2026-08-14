import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env so CLI commands can read DB credentials without the NestJS DI container
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Standalone TypeORM DataSource used by the migration CLI only.
// The NestJS app uses TypeOrmModule.forRootAsync in app.module.ts.
export const AppDataSource = new DataSource({
  type:     'postgres',
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: { rejectUnauthorized: false },

  // Point at compiled JS output so ts-node is not needed in production
  entities:   [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],

  // Never synchronize from the CLI DataSource
  synchronize: false,
  logging:     false,
});
