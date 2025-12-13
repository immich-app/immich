import { Command, CommandRunner } from 'nest-commander';
import { VersionService } from 'src/services/version.service';

@Command({
  name: 'version',
  description: 'Print Immich version',
})
export class VersionCommand extends CommandRunner {
  constructor(private service: VersionService) {
    super();
  }

  run(): Promise<void> {
    try {
      const version = this.service.getVersion();
      console.log(`v${version.major}.${version.minor}.${version.patch}`);
    } catch (error) {
      console.error(error);
      console.error('Unable to get version');
    }

    return Promise.resolve();
  }
}
