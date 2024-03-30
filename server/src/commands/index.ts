import { ListUsersCommand } from 'src/commands/list-users.command';
import { DisableOAuthLogin, EnableOAuthLogin } from 'src/commands/oauth-login';
import { DisablePasswordLoginCommand, EnablePasswordLoginCommand } from 'src/commands/password-login';
import { PromptPasswordQuestions, ResetAdminPasswordCommand } from 'src/commands/reset-admin-password.command';

export const commands = [
  ResetAdminPasswordCommand,
  PromptPasswordQuestions,
  EnablePasswordLoginCommand,
  DisablePasswordLoginCommand,
  EnableOAuthLogin,
  DisableOAuthLogin,
  ListUsersCommand,
];
