import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  Response,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { UserService } from '@app/domain';
import { AdminRoute, Authenticated, PublicRoute } from '../decorators/authenticated.decorator';
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
import { UseValidation } from '../decorators/use-validation.decorator';
import { UserIdDto } from '@app/domain/user/dto/user-id.dto';

@ApiTags('User')
@Controller('user')
@Authenticated()
@UseValidation()
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  getAllUsers(@GetAuthUser() authUser: AuthUserDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAllUsers(authUser, isAll);
  }

  @Get('/info/:userId')
  getUserById(@Param() { userId }: UserIdDto): Promise<UserResponseDto> {
    return this.service.getUserById(userId);
  }

  @Get('me')
  getMyUserInfo(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
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
  deleteUser(@GetAuthUser() authUser: AuthUserDto, @Param() { userId }: UserIdDto): Promise<UserResponseDto> {
    return this.service.deleteUser(authUser, userId);
  }

  @AdminRoute()
  @Post('/:userId/restore')
  restoreUser(@GetAuthUser() authUser: AuthUserDto, @Param() { userId }: UserIdDto): Promise<UserResponseDto> {
    return this.service.restoreUser(authUser, userId);
  }

  @Put()
  updateUser(@GetAuthUser() authUser: AuthUserDto, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
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
    @GetAuthUser() authUser: AuthUserDto,
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
