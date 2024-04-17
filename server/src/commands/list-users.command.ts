import { Command, CommandRunner } from 'nest-commander';
import { UserService } from 'src/services/user.service';

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
      const users = await this.userService.listUsers();
      console.dir(users);
    } catch (error) {
      console.error(error);
      console.error('Unable to load users');
    }
  }
}
