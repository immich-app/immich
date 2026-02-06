import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto } from 'src/dtos/user.dto';
import { ApiTag, Permission, RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { UserService } from 'src/services/user.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Users)
@Controller(RouteKey.User)
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Get all users',
    description: 'Retrieve a list of all users on the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchUsers(@Auth() auth: AuthDto): Promise<UserResponseDto[]> {
    return this.service.search(auth);
  }

  @Get('me')
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Get current user',
    description: 'Retrieve information about the user making the API request.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getMyUser(@Auth() auth: AuthDto): Promise<UserAdminResponseDto> {
    return this.service.getMe(auth);
  }

  @Put('me')
  @Authenticated({ permission: Permission.UserUpdate })
  @Endpoint({
    summary: 'Update current user',
    description: 'Update the current user making the API request.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateMyUser(@Auth() auth: AuthDto, @Body() dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    return this.service.updateMe(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Retrieve a user',
    description: 'Retrieve a specific user by their ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUser(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }
}
