import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
