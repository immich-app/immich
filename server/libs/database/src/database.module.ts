import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOSTNAME || 'immich_postgres',
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE_NAME,
      entities: [__dirname + '/../**/*.entity.{js,ts}'],
      synchronize: false,
      migrations: [__dirname + '/../migration/*.js'],
      migrationsRun: true,
      autoLoadEntities: true,
    }),
  ],
  providers: [

  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
