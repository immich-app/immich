import { Module } from '@nestjs/common';
import { DomainModule } from 'src/domain';
import { InfraModule } from 'src/infra';
import { ListUsersCommand } from './commands/list-users.command';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from './commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [InfraModule, DomainModule],
  providers: [
    ResetAdminPasswordCommand,
    PromptPasswordQuestions,
    EnablePasswordLoginCommand,
    DisablePasswordLoginCommand,
    ListUsersCommand,
  ],
})
export class AppModule {}
