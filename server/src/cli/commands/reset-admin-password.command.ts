import { UserResponseDto, UserService } from '@app/domain';
import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';

@Command({
  name: 'reset-admin-password',
  description: 'Reset the admin password',
})
export class ResetAdminPasswordCommand extends CommandRunner {
  constructor(private userService: UserService, private readonly inquirer: InquirerService) {
    super();
  }

  async run(): Promise<void> {
    const ask = (admin: UserResponseDto) => {
      const { id, oauthId, email, firstName, lastName } = admin;
      console.log(`Found Admin:
- ID=${id}
- OAuth ID=${oauthId}
- Email=${email}
- Name=${firstName} ${lastName}`);

      return this.inquirer.ask<{ password: string }>('prompt-password', undefined).then(({ password }) => password);
    };

    try {
      const { password, provided } = await this.userService.resetAdminPassword(ask);

      if (provided) {
        console.log(`The admin password has been updated.`);
      } else {
        console.log(`The admin password has been updated to:\n${password}`);
      }
    } catch (error) {
      console.error(error);
      console.error('Unable to reset admin password');
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
