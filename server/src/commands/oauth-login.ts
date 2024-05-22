import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'enable-oauth-login',
  description: 'Enable OAuth login',
})
export class EnableOAuthLogin extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.enableOAuthLogin();
    console.log('OAuth login has been enabled.');
  }
}

@Command({
  name: 'disable-oauth-login',
  description: 'Disable OAuth login',
})
export class DisableOAuthLogin extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.disableOAuthLogin();
    console.log('OAuth login has been disabled.');
  }
}
