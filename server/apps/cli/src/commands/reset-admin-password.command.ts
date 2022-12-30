import { UserEntity } from '@app/database';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';

@Command({
  name: 'reset-admin-password',
  description: 'Reset the admin password',
})
export class ResetAdminPasswordCommand extends CommandRunner {
  constructor(
    private readonly inquirer: InquirerService,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async run(): Promise<void> {
    let { password } = await this.inquirer.ask<{ password: string }>('prompt-password', undefined);
    password = password || randomBytes(24).toString('base64').replace(/\W/g, '');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.findOne({ where: { isAdmin: true } });
    if (!user) {
      console.log('Unable to reset password: no admin user.');
      return;
    }

    user.password = hashedPassword;
    user.shouldChangePassword = true;

    await this.userRepository.save(user);

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
