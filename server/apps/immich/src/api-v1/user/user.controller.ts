import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, Put, Query, UseInterceptors, UploadedFile, Response } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminRolesGuard } from '../../middlewares/admin-role-guard.middleware';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageUploadOption } from '../../config/profile-image-upload.config';
import { Response as Res } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@GetAuthUser() authUser: AuthUserDto, @Query('isAll') isAll: boolean) {
    return await this.userService.getAllUsers(authUser, isAll);
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(AdminRolesGuard)
  @Post()
  async createNewUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Get('/count')
  async getUserCount(@Query('isAdmin') isAdmin: boolean) {

    return await this.userService.getUserCount(isAdmin);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateUser(@Body(ValidationPipe) updateUserDto: UpdateUserDto) {
    return await this.userService.updateUser(updateUserDto)
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', profileImageUploadOption))
  @Post('/profile-image')
  async createProfileImage(@GetAuthUser() authUser: AuthUserDto, @UploadedFile() fileInfo: Express.Multer.File) {
    return await this.userService.createProfileImage(authUser, fileInfo);
  }

  @Get('/profile-image/:userId')
  async getProfileImage(@Param('userId') userId: string,
    @Response({ passthrough: true }) res: Res,
  ) {
    return await this.userService.getUserProfileImage(userId, res);
  }
}
