import { DatabaseModule, SystemConfigEntity, UserEntity } from '@app/database';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from './commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([UserEntity, SystemConfigEntity])],
  providers: [
    ResetAdminPasswordCommand,
    PromptPasswordQuestions,
    EnablePasswordLoginCommand,
    DisablePasswordLoginCommand,
  ],
})
export class AppModule {}
