import { DatabaseModule } from '@app/database';
import { UserEntity } from '@app/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [ResetAdminPasswordCommand, PromptPasswordQuestions],
})
export class AppModule {}
