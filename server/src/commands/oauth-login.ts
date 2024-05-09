import { Command, CommandRunner } from 'nest-commander';
import { SystemConfigService } from 'src/services/system-config.service';

@Command({
  name: 'enable-oauth-login',
  description: 'Enable OAuth login',
})
export class EnableOAuthLogin extends CommandRunner {
  constructor(private configService: SystemConfigService) {
    super();
  }

  async run(): Promise<void> {
    const config = await this.configService.getConfig();
    config.oauth.enabled = true;
    await this.configService.updateConfig(config);
    console.log('OAuth login has been enabled.');
  }
}

@Command({
  name: 'disable-oauth-login',
  description: 'Disable OAuth login',
})
export class DisableOAuthLogin extends CommandRunner {
  constructor(private configService: SystemConfigService) {
    super();
  }

  async run(): Promise<void> {
    const config = await this.configService.getConfig();
    config.oauth.enabled = false;
    await this.configService.updateConfig(config);
    console.log('OAuth login has been disabled.');
  }
}
