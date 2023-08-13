import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { ListUsersCommand } from './commands/list-users.command';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from './commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

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
