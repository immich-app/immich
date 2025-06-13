import { GrantAdminCommand, PromptEmailQuestion, RevokeAdminCommand } from 'src/commands/grant-admin';
import { ListUsersCommand } from 'src/commands/list-users.command';
import { DisableOAuthLogin, EnableOAuthLogin } from 'src/commands/oauth-login';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from 'src/commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from 'src/commands/reset-admin-password.command';
import { VersionCommand } from 'src/commands/version.command';

export const commands = [
  ResetAdminPasswordCommand,
  PromptPasswordQuestions,
  PromptEmailQuestion,
  EnablePasswordLoginCommand,
  DisablePasswordLoginCommand,
  EnableOAuthLogin,
  DisableOAuthLogin,
  ListUsersCommand,
  VersionCommand,
  GrantAdminCommand,
  RevokeAdminCommand,
];
