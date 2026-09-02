import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { CliService } from 'src/services/cli.service';

const prompt = (inquirer: InquirerService) => {
  return (admin: UserAdminResponseDto) => {
    const { id, oauthId, email, name } = admin;
    console.log(`Found Admin:
- ID=${id}
- OAuth ID=${oauthId}
- Email=${email}
- Name=${name}`);

    return inquirer.ask<{ newPassword: string; invalidateSessions: boolean }>('prompt-password-reset', {});
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

@QuestionSet({ name: 'prompt-password-reset' })
export class PromptPasswordResetQuestions {
  @Question({
    message: 'Please choose a new password (optional)',
    name: 'newPassword',
  })
  parsePassword(value: string) {
    return value;
  }

  @Question({
    type: 'confirm',
    message: 'Invalidate existing sessions?',
    default: true,
    name: 'invalidateSessions',
  })
  parseInvalidate(value: boolean): boolean {
    return value;
  }
}
