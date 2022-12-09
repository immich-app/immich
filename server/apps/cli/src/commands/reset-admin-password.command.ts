import { UserService } from '@app/common';
import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { randomBytes } from 'node:crypto';

@Command({
  name: 'reset-admin-password',
  description: 'Reset the admin password',
})
export class ResetAdminPasswordCommand extends CommandRunner {
  constructor(private readonly inquirer: InquirerService, private readonly userService: UserService) {
    super();
  }

  async run(): Promise<void> {
    let { password } = await this.inquirer.ask<{ password: string }>('prompt-password', undefined);
    password = password || randomBytes(24).toString('base64').replace(/\W/g, '');

    const admin = await this.userService.getAdmin();
    if (!admin) {
      console.log('Unable to reset password: no admin user.');
      return;
    }

    await this.userService.update(admin.id, { id: admin.id, password });

    console.log(`New password:\n${password}`);
  }
}

@QuestionSet({ name: 'prompt-password' })
export class PromptPasswordQuestions {
  @Question({
    message: 'Please choose a new password (optional)',
    name: 'password',
  })
  parsePassword(val: string) {
    return val;
  }
}
