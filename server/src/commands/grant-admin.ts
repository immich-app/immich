import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

const prompt = (inquirer: InquirerService) => {
  return function ask(): Promise<string> {
    return inquirer.ask<{ email: string }>('prompt-email', {}).then(({ email }: { email: string }) => email);
  };
};

@Command({
  name: 'grant-admin',
  description: 'Grant admin privileges to a user (by email)',
})
export class GrantAdminCommand extends CommandRunner {
  constructor(
    private service: CliService,
    private inquirer: InquirerService,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      const email = await prompt(this.inquirer)();
      await this.service.grantAdminAccess(email);
      console.debug('Admin access has been granted to', email);
    } catch (error) {
      console.error(error);
      console.error('Unable to grant admin access to user');
    }
  }
}

@Command({
  name: 'revoke-admin',
  description: 'Revoke admin privileges from a user (by email)',
})
export class RevokeAdminCommand extends CommandRunner {
  constructor(
    private service: CliService,
    private inquirer: InquirerService,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      const email = await prompt(this.inquirer)();
      await this.service.revokeAdminAccess(email);
      console.debug('Admin access has been revoked from', email);
    } catch (error) {
      console.error(error);
      console.error('Unable to revoke admin access from user');
    }
  }
}

@QuestionSet({ name: 'prompt-email' })
export class PromptEmailQuestion {
  @Question({
    message: 'Please enter the user email: ',
    name: 'email',
  })
  parseEmail(value: string) {
    return value;
  }
}
