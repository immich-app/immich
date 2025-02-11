import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { User } from 'src/models/user.model';
import { UserService } from 'src/services/user.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private service: UserService) {}

  @Authenticated()
  @Query(() => User)
  async user(@Args('id', { type: () => Int }) id: string) {
    return this.service.get(id);
  }

  @Authenticated()
  @Query(() => [User])
  async users(@Auth() auth: AuthDto) {
    return this.service.search(auth);
  }
}
