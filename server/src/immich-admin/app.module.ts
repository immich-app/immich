import { Module } from '@nestjs/common';
import { DomainModule } from 'src/domain/domain.module';
import { ListUsersCommand } from 'src/immich-admin/commands/list-users.command';
import { DisableOAuthLogin, EnableOAuthLogin } from 'src/immich-admin/commands/oauth-login';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from 'src/immich-admin/commands/password-login';
import {
  PromptPasswordQuestions,
  ResetAdminPasswordCommand,
} from 'src/immich-admin/commands/reset-admin-password.command';
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
export class AppModule {}
