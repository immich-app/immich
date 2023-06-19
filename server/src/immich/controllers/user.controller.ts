import {
  CreateProfileImageDto,
  CreateProfileImageResponseDto,
  CreateUserDto,
  UpdateUserDto,
  UserCountDto,
  UserCountResponseDto,
  UserResponseDto,
  UserService,
} from '@app/domain';
import { UserIdDto } from '@app/domain/user/dto/user-id.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Response,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response as Res } from 'express';
import { profileImageUploadOption } from '../config/profile-image-upload.config';
import { AuthUser, AuthUserDto } from '../decorators/auth-user.decorator';
import { AdminRoute, Authenticated, PublicRoute } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

@ApiTags('User')
@Controller('user')
@Authenticated()
@UseValidation()
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  getAllUsers(@AuthUser() authUser: AuthUserDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAllUsers(authUser, isAll);
  }

  @Get('/info/:userId')
  getUserById(@Param() { userId }: UserIdDto): Promise<UserResponseDto> {
    return this.service.getUserById(userId);
  }

  @Get('me')
  getMyUserInfo(@AuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.service.getUserInfo(authUser);
  }

  @AdminRoute()
  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.createUser(createUserDto);
  }

  @PublicRoute()
  @Get('/count')
  getUserCount(@Query() dto: UserCountDto): Promise<UserCountResponseDto> {
    return this.service.getUserCount(dto);
  }

  @AdminRoute()
  @Delete('/:userId')
  deleteUser(@AuthUser() authUser: AuthUserDto, @Param() { userId }: UserIdDto): Promise<UserResponseDto> {
    return this.service.deleteUser(authUser, userId);
  }

  @AdminRoute()
  @Post('/:userId/restore')
  restoreUser(@AuthUser() authUser: AuthUserDto, @Param() { userId }: UserIdDto): Promise<UserResponseDto> {
    return this.service.restoreUser(authUser, userId);
  }

  @Put()
  updateUser(@AuthUser() authUser: AuthUserDto, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.service.updateUser(authUser, updateUserDto);
  }

  @UseInterceptors(FileInterceptor('file', profileImageUploadOption))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'A new avatar for the user',
    type: CreateProfileImageDto,
  })
  @Post('/profile-image')
  createProfileImage(
    @AuthUser() authUser: AuthUserDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(authUser, fileInfo);
  }

  @Get('/profile-image/:userId')
  @Header('Cache-Control', 'max-age=600')
  async getProfileImage(@Param() { userId }: UserIdDto, @Response({ passthrough: true }) res: Res): Promise<any> {
    const readableStream = await this.service.getUserProfileImage(userId);
    res.header('Content-Type', 'image/jpeg');
    return new StreamableFile(readableStream);
  }
}
