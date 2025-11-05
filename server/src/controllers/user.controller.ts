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
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import { OnboardingDto, OnboardingResponseDto } from 'src/dtos/onboarding.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { CreateProfileImageDto, CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto } from 'src/dtos/user.dto';
import { Permission, RouteKey } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserService } from 'src/services/user.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Users')
@Controller(RouteKey.User)
export class UserController {
  constructor(
    private service: UserService,
    private logger: LoggingRepository,
  ) {}

  @Get()
  @Authenticated({ permission: Permission.UserRead })
  searchUsers(@Auth() auth: AuthDto): Promise<UserResponseDto[]> {
    return this.service.search(auth);
  }

  @Get('me')
  @Authenticated({ permission: Permission.UserRead })
  getMyUser(@Auth() auth: AuthDto): Promise<UserAdminResponseDto> {
    return this.service.getMe(auth);
  }

  @Put('me')
  @Authenticated({ permission: Permission.UserUpdate })
  updateMyUser(@Auth() auth: AuthDto, @Body() dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    return this.service.updateMe(auth, dto);
  }

  @Get('me/preferences')
  @Authenticated({ permission: Permission.UserPreferenceRead })
  getMyPreferences(@Auth() auth: AuthDto): Promise<UserPreferencesResponseDto> {
    return this.service.getMyPreferences(auth);
  }

  @Put('me/preferences')
  @Authenticated({ permission: Permission.UserPreferenceUpdate })
  updateMyPreferences(
    @Auth() auth: AuthDto,
    @Body() dto: UserPreferencesUpdateDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.service.updateMyPreferences(auth, dto);
  }

  @Get('me/license')
  @Authenticated({ permission: Permission.UserLicenseRead })
  getUserLicense(@Auth() auth: AuthDto): Promise<LicenseResponseDto> {
    return this.service.getLicense(auth);
  }

  @Put('me/license')
  @Authenticated({ permission: Permission.UserLicenseUpdate })
  async setUserLicense(@Auth() auth: AuthDto, @Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(auth, license);
  }

  @Delete('me/license')
  @Authenticated({ permission: Permission.UserLicenseDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserLicense(@Auth() auth: AuthDto): Promise<void> {
    await this.service.deleteLicense(auth);
  }

  @Get('me/onboarding')
  @Authenticated({ permission: Permission.UserOnboardingRead })
  getUserOnboarding(@Auth() auth: AuthDto): Promise<OnboardingResponseDto> {
    return this.service.getOnboarding(auth);
  }

  @Put('me/onboarding')
  @Authenticated({ permission: Permission.UserOnboardingUpdate })
  async setUserOnboarding(@Auth() auth: AuthDto, @Body() Onboarding: OnboardingDto): Promise<OnboardingResponseDto> {
    return this.service.setOnboarding(auth, Onboarding);
  }

  @Delete('me/onboarding')
  @Authenticated({ permission: Permission.UserOnboardingDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserOnboarding(@Auth() auth: AuthDto): Promise<void> {
    await this.service.deleteOnboarding(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.UserRead })
  getUser(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Post('profile-image')
  @Authenticated({ permission: Permission.UserProfileImageUpdate })
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(auth, fileInfo);
  }

  @Delete('profile-image')
  @Authenticated({ permission: Permission.UserProfileImageDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
  }

  @Get(':id/profile-image')
  @FileResponse()
  @Authenticated({ permission: Permission.UserProfileImageRead })
  async getProfileImage(@Res() res: Response, @Next() next: NextFunction, @Param() { id }: UUIDParamDto) {
    await sendFile(res, next, () => this.service.getProfileImage(id), this.logger);
  }
}
