import { Command, CommandRunner } from 'nest-commander';
import { UserService } from 'src/domain/user/user.service';
import { UserEntity } from 'src/infra/entities/user.entity';

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
      const users = await this.userService.getAll(
        {
          user: {
            id: 'cli',
            email: 'cli@immich.app',
            isAdmin: true,
          } as UserEntity,
        },
        true,
      );
      console.dir(users);
    } catch (error) {
      console.error(error);
      console.error('Unable to load users');
    }
  }
}
