import { UserService } from '@app/domain';
import { Command, CommandRunner } from 'nest-commander';
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
      const users = await this.userService.getAllUsers(CLI_USER, true);
      console.dir(users);
    } catch (error) {
      console.error(error);
      console.error('Unable to load users');
    }
  }
}
