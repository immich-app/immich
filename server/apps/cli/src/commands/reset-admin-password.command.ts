import { Inject } from '@nestjs/common';
import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { randomBytes } from 'node:crypto';
import { IUserRepository, UserCore } from '@app/domain';

@Command({
  name: 'reset-admin-password',
  description: 'Reset the admin password',
})
export class ResetAdminPasswordCommand extends CommandRunner {
  userCore: UserCore;

  constructor(private readonly inquirer: InquirerService, @Inject(IUserRepository) userRepository: IUserRepository) {
    super();

    this.userCore = new UserCore(userRepository);
  }

  async run(): Promise<void> {
    const user = await this.userCore.getAdmin();
    if (!user) {
      console.log('Unable to reset password: no admin user.');
      return;
    }

    const { password: providedPassword } = await this.inquirer.ask<{ password: string }>('prompt-password', undefined);
    const password = providedPassword || randomBytes(24).toString('base64').replace(/\W/g, '');

    await this.userCore.updateUser(user, user.id, { password });

    if (providedPassword) {
      console.log('The admin password has been updated.');
    } else {
      console.log(`The admin password has been updated to:\n${password}`);
    }
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
