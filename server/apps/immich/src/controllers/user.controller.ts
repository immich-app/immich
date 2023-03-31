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
  StreamableFile,
  Header,
  UsePipes,
} from '@nestjs/common';
import { UserService } from '@app/domain';
import { Authenticated } from '../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../decorators/auth-user.decorator';
import { CreateUserDto } from '@app/domain';
import { UpdateUserDto } from '@app/domain';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageUploadOption } from '../config/profile-image-upload.config';
import { Response as Res } from 'express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from '@app/domain';
import { UserCountResponseDto } from '@app/domain';
import { CreateProfileImageDto } from '@app/domain';
import { CreateProfileImageResponseDto } from '@app/domain';
import { UserCountDto } from '@app/domain';

@ApiTags('User')
@Controller('user')
@UsePipes(new ValidationPipe({ transform: true }))
export class UserController {
  constructor(private service: UserService) {}

  @Authenticated()
  @Get()
  getAllUsers(@GetAuthUser() authUser: AuthUserDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAllUsers(authUser, isAll);
  }

  @Authenticated()
  @Get('/info/:userId')
  getUserById(@Param('userId') userId: string): Promise<UserResponseDto> {
    return this.service.getUserById(userId);
  }

  @Authenticated()
  @Get('me')
  getMyUserInfo(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.service.getUserInfo(authUser);
  }

  @Authenticated({ admin: true })
  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.createUser(createUserDto);
  }

  @Get('/count')
  getUserCount(@Query() dto: UserCountDto): Promise<UserCountResponseDto> {
    return this.service.getUserCount(dto);
  }

  @Authenticated({ admin: true })
  @Delete('/:userId')
  deleteUser(@GetAuthUser() authUser: AuthUserDto, @Param('userId') userId: string): Promise<UserResponseDto> {
    return this.service.deleteUser(authUser, userId);
  }

  @Authenticated({ admin: true })
  @Post('/:userId/restore')
  restoreUser(@GetAuthUser() authUser: AuthUserDto, @Param('userId') userId: string): Promise<UserResponseDto> {
    return this.service.restoreUser(authUser, userId);
  }

  @Authenticated()
  @Put()
  updateUser(@GetAuthUser() authUser: AuthUserDto, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.service.updateUser(authUser, updateUserDto);
  }

  @Authenticated()
  @UseInterceptors(FileInterceptor('file', profileImageUploadOption))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'A new avatar for the user',
    type: CreateProfileImageDto,
  })
  @Post('/profile-image')
  createProfileImage(
    @GetAuthUser() authUser: AuthUserDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(authUser, fileInfo);
  }

  @Authenticated()
  @Get('/profile-image/:userId')
  @Header('Cache-Control', 'max-age=600')
  async getProfileImage(@Param('userId') userId: string, @Response({ passthrough: true }) res: Res): Promise<any> {
    const readableStream = await this.service.getUserProfileImage(userId);
    res.header('Content-Type', 'image/jpeg');
    return new StreamableFile(readableStream);
  }
}
