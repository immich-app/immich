import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { ListUsersCommand } from './commands/list-users.command.js';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from './commands/password-login.js';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command.js';

@Module({
  imports: [DomainModule.register({ imports: [InfraModule] })],
  providers: [
    ResetAdminPasswordCommand,
    PromptPasswordQuestions,
    EnablePasswordLoginCommand,
    DisablePasswordLoginCommand,
    ListUsersCommand,
  ],
})
export class AppModule {}
