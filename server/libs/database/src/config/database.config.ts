import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const databaseConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOSTNAME || 'immich_postgres',
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE_NAME,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: false,
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  migrationsRun: true,
};

export default databaseConfig;
