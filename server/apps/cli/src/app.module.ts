import { CommonModule } from '@app/common';
import { databaseConfig, DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [CommonModule, DatabaseModule, TypeOrmModule.forRoot(databaseConfig)],
  providers: [ResetAdminPasswordCommand, PromptPasswordQuestions],
})
export class AppModule {}
