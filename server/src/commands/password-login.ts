import { Command, CommandRunner } from 'nest-commander';
import { SystemConfigService } from 'src/services/system-config.service';

@Command({
  name: 'enable-password-login',
  description: 'Enable password login',
})
export class EnablePasswordLoginCommand extends CommandRunner {
  constructor(private configService: SystemConfigService) {
    super();
  }

  async run(): Promise<void> {
    const config = await this.configService.getConfig();
    config.passwordLogin.enabled = true;
    await this.configService.updateConfig(config);
    console.log('Password login has been enabled.');
  }
}

@Command({
  name: 'disable-password-login',
  description: 'Disable password login',
})
export class DisablePasswordLoginCommand extends CommandRunner {
  constructor(private configService: SystemConfigService) {
    super();
  }

  async run(): Promise<void> {
    const config = await this.configService.getConfig();
    config.passwordLogin.enabled = false;
    await this.configService.updateConfig(config);
    console.log('Password login has been disabled.');
  }
}
