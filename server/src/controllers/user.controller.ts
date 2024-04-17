import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Next,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { CreateProfileImageDto, CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { CreateUserDto, DeleteUserDto, UpdateUserDto, UserResponseDto } from 'src/dtos/user.dto';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, Route } from 'src/middleware/file-upload.interceptor';
import { UserService } from 'src/services/user.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('User')
@Controller(Route.USER)
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  @Authenticated(Permission.USER_READ)
  getAllUsers(@Auth() auth: AuthDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAll(auth, isAll);
  }

  @Get('info/:id')
  @Authenticated(Permission.USER_READ)
  getUserById(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Get('me')
  @Authenticated(Permission.USER_READ)
  getMyUserInfo(@Auth() auth: AuthDto): Promise<UserResponseDto> {
    return this.service.getMe(auth);
  }

  @Post()
  @Authenticated(Permission.USER_CREATE)
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.create(createUserDto);
  }

  @Delete('profile-image')
  @Authenticated(Permission.USER_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
  }

  @Delete(':id')
  @Authenticated(Permission.USER_DELETE)
  deleteUser(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: DeleteUserDto,
  ): Promise<UserResponseDto> {
    return this.service.delete(auth, id, dto);
  }

  @Post(':id/restore')
  @Authenticated(Permission.USER_DELETE)
  restoreUser(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.restore(auth, id);
  }

  // TODO: replace with @Put(':id')
  @Put()
  @Authenticated(Permission.USER_UPDATE)
  updateUser(@Auth() auth: AuthDto, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.service.update(auth, updateUserDto);
  }

  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Post('profile-image')
  @Authenticated(Permission.USER_UPDATE)
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(auth, fileInfo);
  }

  @Get('profile-image/:id')
  @Authenticated(Permission.USER_READ)
  @FileResponse()
  async getProfileImage(@Res() res: Response, @Next() next: NextFunction, @Param() { id }: UUIDParamDto) {
    await sendFile(res, next, () => this.service.getProfileImage(id));
  }
}
