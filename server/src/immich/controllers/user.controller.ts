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
import { AuthDto } from 'src/domain/auth/auth.dto';
import { CreateProfileImageDto } from 'src/domain/user/dto/create-profile-image.dto';
import { CreateUserDto } from 'src/domain/user/dto/create-user.dto';
import { DeleteUserDto } from 'src/domain/user/dto/delete-user.dto';
import { UpdateUserDto } from 'src/domain/user/dto/update-user.dto';
import { CreateProfileImageResponseDto } from 'src/domain/user/response-dto/create-profile-image-response.dto';
import { UserResponseDto } from 'src/domain/user/response-dto/user-response.dto';
import { UserService } from 'src/domain/user/user.service';
import { AdminRoute, Auth, Authenticated, FileResponse } from 'src/immich/app.guard';
import { sendFile } from 'src/immich/app.utils';
import { UUIDParamDto } from 'src/immich/controllers/dto/uuid-param.dto';
import { FileUploadInterceptor, Route } from 'src/immich/interceptors/file-upload.interceptor';

@ApiTags('User')
@Controller(Route.USER)
@Authenticated()
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  getAllUsers(@Auth() auth: AuthDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAll(auth, isAll);
  }

  @Get('info/:id')
  getUserById(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Get('me')
  getMyUserInfo(@Auth() auth: AuthDto): Promise<UserResponseDto> {
    return this.service.getMe(auth);
  }

  @AdminRoute()
  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.create(createUserDto);
  }

  @Delete('profile-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
  }

  @AdminRoute()
  @Delete(':id')
  deleteUser(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: DeleteUserDto,
  ): Promise<UserResponseDto> {
    return this.service.delete(auth, id, dto);
  }

  @AdminRoute()
  @Post(':id/restore')
  restoreUser(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.restore(auth, id);
  }

  // TODO: replace with @Put(':id')
  @Put()
  updateUser(@Auth() auth: AuthDto, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.service.update(auth, updateUserDto);
  }

  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Post('profile-image')
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(auth, fileInfo);
  }

  @Get('profile-image/:id')
  @FileResponse()
  async getProfileImage(@Res() res: Response, @Next() next: NextFunction, @Param() { id }: UUIDParamDto) {
    await sendFile(res, next, () => this.service.getProfileImage(id));
  }
}
