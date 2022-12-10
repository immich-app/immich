import { CommonModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [ResetAdminPasswordCommand, PromptPasswordQuestions],
})
export class AppModule {}
