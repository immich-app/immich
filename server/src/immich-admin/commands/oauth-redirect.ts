import { SystemConfigService } from '@app/domain';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'enable-oauth-auto-redirect',
  description: 'Enable OAuth auto-redirect',
})
export class EnableOauthAutoRedirect extends CommandRunner {
  constructor(private configService: SystemConfigService) {
    super();
  }

  async run(): Promise<void> {
    const config = await this.configService.getConfig();
    config.oauth.autoLaunch = true;
    await this.configService.updateConfig(config);
    console.log('OAuth auto-redirect has been enabled.');
  }
}

@Command({
  name: 'disable-oauth-auto-redirect',
  description: 'Disable OAuth auto-redirect',
})
export class DisableOauthAutoRedirect extends CommandRunner {
  constructor(private configService: SystemConfigService) {
    super();
  }

  async run(): Promise<void> {
    const config = await this.configService.getConfig();
    config.oauth.autoLaunch = false;
    await this.configService.updateConfig(config);
    console.log('OAuth auto-redirect has been disabled.');
  }
}
