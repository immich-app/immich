import { Command, CommandRunner } from 'nest-commander';
import { UserService } from 'src/domain';
import { CLI_USER } from '../constants';

@Command({
  name: 'list-users',
  description: 'List Immich users',
})
export class ListUsersCommand extends CommandRunner {
  constructor(private userService: UserService) {
    super();
  }

  async run(): Promise<void> {
    try {
      const users = await this.userService.getAll(CLI_USER, true);
      console.dir(users);
    } catch (error) {
      console.error(error);
      console.error('Unable to load users');
    }
  }
}
