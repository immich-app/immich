import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'enable-password-login',
  description: 'Enable password login',
})
export class EnablePasswordLoginCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.enablePasswordLogin();
    console.log('Password login has been enabled.');
  }
}

@Command({
  name: 'disable-password-login',
  description: 'Disable password login',
})
export class DisablePasswordLoginCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.disablePasswordLogin();
    console.log('Password login has been disabled.');
  }
}
