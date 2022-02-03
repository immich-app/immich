import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
  console.log(result.error);
}

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'immich_postgres',
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE_NAME,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: true,
  // logging: true,
  // logger: 'advanced-console',
  // ssl: process.env.NODE_ENV == 'production',
  // extra: {
  //   ssl: {
  //     rejectUnauthorized: false,
  //   },
  // },
};
