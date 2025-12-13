import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'list-users',
  description: 'List Immich users',
})
export class ListUsersCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    try {
      const users = await this.service.listUsers();
      console.dir(users);
    } catch (error) {
      console.error(error);
      console.error('Unable to load users');
    }
  }
}
