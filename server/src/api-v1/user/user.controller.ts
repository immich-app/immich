import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminRolesGuard } from '../../middlewares/admin-role-guard.middleware';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@GetAuthUser() authUser: AuthUserDto) {
    return await this.userService.getAllUsers(authUser);
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(AdminRolesGuard)
  @Post()
  async createNewUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Get('/count')
  async getUserCount() {
    return await this.userService.getUserCount();
  }
}
