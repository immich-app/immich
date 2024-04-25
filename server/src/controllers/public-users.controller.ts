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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateProfileImageDto, CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UpdateUserDto, UserDto, UserResponseDto } from 'src/dtos/user.dto';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, Route } from 'src/middleware/file-upload.interceptor';
import { UserService } from 'src/services/user.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Public Users')
@Controller(Route.PUBLICUSERS)
@Authenticated()
export class PublicUsersController {
  constructor(private service: UserService) {}

  @Get()
  getAllPublicUsers(): Promise<UserDto[]> {
    return this.service.getAllPublic();
  }

  @Get('info/:id')
  getPublicUserById(@Param() { id }: UUIDParamDto): Promise<UserDto> {
    return this.service.getPublic(id);
  }

  @Delete('profile-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
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
