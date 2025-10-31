import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'enable-maintenance-mode',
  description: 'Enable maintenance mode',
})
export class EnableMaintenanceModeCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.enableMaintenanceMode();
    console.log("Maintenance mode has been enabled.\nThis change won't automatically propagate.");
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
    console.log("Maintenance mode has been disabled.\nThis change won't automatically propagate.");
  }
}
