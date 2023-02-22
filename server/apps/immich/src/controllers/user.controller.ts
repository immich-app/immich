import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ValidationPipe,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  Response,
  ParseBoolPipe,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { UserService } from '@app/domain';
import { Authenticated } from '../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../decorators/auth-user.decorator';
import { CreateUserDto } from '@app/domain';
import { UpdateUserDto } from '@app/domain';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageUploadOption } from '../config/profile-image-upload.config';
import { Response as Res } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from '@app/domain';
import { UserCountResponseDto } from '@app/domain';
import { CreateProfileImageDto } from '@app/domain';
import { CreateProfileImageResponseDto } from '@app/domain';
import { UserCountDto } from '@app/domain';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authenticated()
  @ApiBearerAuth()
  @Get()
  async getAllUsers(
    @GetAuthUser() authUser: AuthUserDto,
    @Query('isAll', ParseBoolPipe) isAll: boolean,
  ): Promise<UserResponseDto[]> {
    return await this.userService.getAllUsers(authUser, isAll);
  }

  @Get('/info/:userId')
  async getUserById(@Param('userId') userId: string): Promise<UserResponseDto> {
    return await this.userService.getUserById(userId);
  }

  @Authenticated()
  @ApiBearerAuth()
  @Get('me')
  async getMyUserInfo(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return await this.userService.getUserInfo(authUser);
  }

  @Authenticated({ admin: true })
  @ApiBearerAuth()
  @Post()
  async createUser(
    @Body(new ValidationPipe({ transform: true })) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.createUser(createUserDto);
  }

  @Get('/count')
  async getUserCount(@Query(new ValidationPipe({ transform: true })) dto: UserCountDto): Promise<UserCountResponseDto> {
    return await this.userService.getUserCount(dto);
  }

  @Authenticated({ admin: true })
  @ApiBearerAuth()
  @Delete('/:userId')
  async deleteUser(@GetAuthUser() authUser: AuthUserDto, @Param('userId') userId: string): Promise<UserResponseDto> {
    return await this.userService.deleteUser(authUser, userId);
  }

  @Authenticated({ admin: true })
  @ApiBearerAuth()
  @Post('/:userId/restore')
  async restoreUser(@GetAuthUser() authUser: AuthUserDto, @Param('userId') userId: string): Promise<UserResponseDto> {
    return await this.userService.restoreUser(authUser, userId);
  }

  @Authenticated()
  @ApiBearerAuth()
  @Put()
  async updateUser(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateUser(authUser, updateUserDto);
  }

  @UseInterceptors(FileInterceptor('file', profileImageUploadOption))
  @Authenticated()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'A new avatar for the user',
    type: CreateProfileImageDto,
  })
  @Post('/profile-image')
  async createProfileImage(
    @GetAuthUser() authUser: AuthUserDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return await this.userService.createProfileImage(authUser, fileInfo);
  }

  @Get('/profile-image/:userId')
  @Header('Cache-Control', 'max-age=600')
  async getProfileImage(@Param('userId') userId: string, @Response({ passthrough: true }) res: Res): Promise<any> {
    const readableStream = await this.userService.getUserProfileImage(userId);
    res.set({
      'Content-Type': 'image/jpeg',
    });
    return new StreamableFile(readableStream);
  }
}
