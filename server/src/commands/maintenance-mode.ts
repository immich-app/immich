import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'enable-maintenance-mode',
  description: 'Enable maintenance mode or regenerate the maintenance token',
})
export class EnableMaintenanceModeCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    const { authUrl } = await this.service.enableMaintenanceMode();
    console.log('Maintenance mode has been enabled.');
    console.info(authUrl);
  }
}

@Command({
  name: 'disable-maintenance-mode',
  description: 'Disable maintenance mode',
})
export class DisableMaintenanceModeCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.disableMaintenanceMode();
    console.log('Maintenance mode has been disabled.');
  }
}
