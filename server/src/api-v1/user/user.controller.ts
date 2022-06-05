import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ImmichAuthGuard } from '../../modules/immich-jwt/guards/immich-auth.guard';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';

@UseGuards(ImmichAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@GetAuthUser() authUser: AuthUserDto) {
    return await this.userService.getAllUsers(authUser);
  }
}
