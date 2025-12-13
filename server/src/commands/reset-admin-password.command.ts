import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { CliService } from 'src/services/cli.service';

const prompt = (inquirer: InquirerService) => {
  return function ask(admin: UserAdminResponseDto) {
    const { id, oauthId, email, name } = admin;
    console.log(`Found Admin:
- ID=${id}
- OAuth ID=${oauthId}
- Email=${email}
- Name=${name}`);

    return inquirer.ask<{ password: string }>('prompt-password', {}).then(({ password }) => password);
  };
};

@Command({
  name: 'reset-admin-password',
  description: 'Reset the admin password',
})
export class ResetAdminPasswordCommand extends CommandRunner {
  constructor(
    private service: CliService,
    private inquirer: InquirerService,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      const { password, provided } = await this.service.resetAdminPassword(prompt(this.inquirer));

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
  parsePassword(value: string) {
    return value;
  }
}
