import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { CreateProfileImageDto, CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto } from 'src/dtos/user.dto';
import { RouteKey } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { UserService } from 'src/services/user.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Users')
@Controller(RouteKey.USER)
export class UserController {
  constructor(
    private service: UserService,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {}

  @Get()
  @Authenticated()
  searchUsers(): Promise<UserResponseDto[]> {
    return this.service.search();
  }

  @Get('me')
  @Authenticated()
  getMyUser(@Auth() auth: AuthDto): UserAdminResponseDto {
    return this.service.getMe(auth);
  }

  @Put('me')
  @Authenticated()
  updateMyUser(@Auth() auth: AuthDto, @Body() dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    return this.service.updateMe(auth, dto);
  }

  @Get('me/preferences')
  @Authenticated()
  getMyPreferences(@Auth() auth: AuthDto): UserPreferencesResponseDto {
    return this.service.getMyPreferences(auth);
  }

  @Put('me/preferences')
  @Authenticated()
  updateMyPreferences(
    @Auth() auth: AuthDto,
    @Body() dto: UserPreferencesUpdateDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.service.updateMyPreferences(auth, dto);
  }

  @Get('me/license')
  @Authenticated()
  getUserLicense(@Auth() auth: AuthDto): LicenseResponseDto {
    return this.service.getLicense(auth);
  }

  @Put('me/license')
  @Authenticated()
  async setUserLicense(@Auth() auth: AuthDto, @Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(auth, license);
  }

  @Delete('me/license')
  @Authenticated()
  async deleteUserLicense(@Auth() auth: AuthDto): Promise<void> {
    await this.service.deleteLicense(auth);
  }

  @Get(':id')
  @Authenticated()
  getUser(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Post('profile-image')
  @Authenticated()
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(auth, fileInfo);
  }

  @Delete('profile-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
  }

  @Get(':id/profile-image')
  @FileResponse()
  @Authenticated()
  async getProfileImage(@Res() res: Response, @Next() next: NextFunction, @Param() { id }: UUIDParamDto) {
    await sendFile(res, next, () => this.service.getProfileImage(id), this.logger);
  }
}
