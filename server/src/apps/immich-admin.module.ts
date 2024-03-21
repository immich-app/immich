import { Module } from '@nestjs/common';
import { AppModule } from 'src/apps/app.module';
import { ListUsersCommand } from 'src/commands/list-users.command';
import { DisableOAuthLogin, EnableOAuthLogin } from 'src/commands/oauth-login';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from 'src/commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from 'src/commands/reset-admin-password.command';

@Module({
  imports: [AppModule],
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
