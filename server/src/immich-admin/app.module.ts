import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { ListUsersCommand } from './commands/list-users.command';
import { DisableOAuthLogin, EnableOAuthLogin } from './commands/oauth-login';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from './commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [InfraModule, DomainModule],
  providers: [
    ResetAdminPasswordCommand,
    PromptPasswordQuestions,
    EnablePasswordLoginCommand,
    DisablePasswordLoginCommand,
    EnableOAuthLogin,
    DisableOAuthLogin,
    ListUsersCommand,
  ],
})
export class AppModule {}
