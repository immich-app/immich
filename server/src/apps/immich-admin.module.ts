import { Module } from '@nestjs/common';
import { ListUsersCommand } from 'src/commands/list-users.command';
import { DisableOAuthLogin, EnableOAuthLogin } from 'src/commands/oauth-login';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from 'src/commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from 'src/commands/reset-admin-password.command';
import { DomainModule } from 'src/domain/domain.module';
import { InfraModule } from 'src/infra/infra.module';

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
export class ImmichAdminModule {}
