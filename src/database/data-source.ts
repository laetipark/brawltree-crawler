import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: `.production.env` });

export const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  timezone: process.env.DATABASE_TIMEZONE,
  entities: ['dist/**/**/*.entity.{ts,js}'],
  synchronize: false,
  migrationsTableName: 'migrations',
  migrations: [`dist/database/${process.env.MIGRATION_TYPE}/*.{ts,js}`],
  logging: true,
});
