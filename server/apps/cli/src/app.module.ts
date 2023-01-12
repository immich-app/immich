import { DomainModule } from '@app/domain';
import { InfraModule, SystemConfigEntity } from '@app/infra';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from './commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from './commands/reset-admin-password.command';

@Module({
  imports: [
    DomainModule.register({
      imports: [InfraModule],
    }),
    TypeOrmModule.forFeature([SystemConfigEntity]),
  ],
  providers: [
    ResetAdminPasswordCommand,
    PromptPasswordQuestions,
    EnablePasswordLoginCommand,
    DisablePasswordLoginCommand,
  ],
})
export class AppModule {}
