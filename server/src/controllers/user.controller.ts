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
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import { OnboardingDto, OnboardingResponseDto } from 'src/dtos/onboarding.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { CreateProfileImageDto, CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto } from 'src/dtos/user.dto';
import { ApiTag, Permission, RouteKey } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserService } from 'src/services/user.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Users)
@Controller(RouteKey.User)
export class UserController {
  constructor(
    private service: UserService,
    private logger: LoggingRepository,
  ) {}

  @Get()
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Get all users',
    description: 'Retrieve a list of all users on the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchUsers(@Auth() auth: AuthDto): Promise<UserResponseDto[]> {
    return this.service.search(auth);
  }

  @Get('me')
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Get current user',
    description: 'Retrieve information about the user making the API request.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getMyUser(@Auth() auth: AuthDto): Promise<UserAdminResponseDto> {
    return this.service.getMe(auth);
  }

  @Put('me')
  @Authenticated({ permission: Permission.UserUpdate })
  @Endpoint({
    summary: 'Update current user',
    description: 'Update the current user making teh API request.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateMyUser(@Auth() auth: AuthDto, @Body() dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    return this.service.updateMe(auth, dto);
  }

  @Get('me/preferences')
  @Authenticated({ permission: Permission.UserPreferenceRead })
  @Endpoint({
    summary: 'Get my preferences',
    description: 'Retrieve the preferences for the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getMyPreferences(@Auth() auth: AuthDto): Promise<UserPreferencesResponseDto> {
    return this.service.getMyPreferences(auth);
  }

  @Put('me/preferences')
  @Authenticated({ permission: Permission.UserPreferenceUpdate })
  @Endpoint({
    summary: 'Update my preferences',
    description: 'Update the preferences of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateMyPreferences(
    @Auth() auth: AuthDto,
    @Body() dto: UserPreferencesUpdateDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.service.updateMyPreferences(auth, dto);
  }

  @Get('me/license')
  @Authenticated({ permission: Permission.UserLicenseRead })
  @Endpoint({
    summary: 'Retrieve user product key',
    description: 'Retrieve information about whether the current user has a registered product key.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUserLicense(@Auth() auth: AuthDto): Promise<LicenseResponseDto> {
    return this.service.getLicense(auth);
  }

  @Put('me/license')
  @Authenticated({ permission: Permission.UserLicenseUpdate })
  @Endpoint({
    summary: 'Set user product key',
    description: 'Register a product key for the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async setUserLicense(@Auth() auth: AuthDto, @Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(auth, license);
  }

  @Delete('me/license')
  @Authenticated({ permission: Permission.UserLicenseDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete user product key',
    description: 'Delete the registered product key for the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async deleteUserLicense(@Auth() auth: AuthDto): Promise<void> {
    await this.service.deleteLicense(auth);
  }

  @Get('me/onboarding')
  @Authenticated({ permission: Permission.UserOnboardingRead })
  @Endpoint({
    summary: 'Retrieve user onboarding',
    description: 'Retrieve the onboarding status of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUserOnboarding(@Auth() auth: AuthDto): Promise<OnboardingResponseDto> {
    return this.service.getOnboarding(auth);
  }

  @Put('me/onboarding')
  @Authenticated({ permission: Permission.UserOnboardingUpdate })
  @Endpoint({
    summary: 'Update user onboarding',
    description: 'Update the onboarding status of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async setUserOnboarding(@Auth() auth: AuthDto, @Body() Onboarding: OnboardingDto): Promise<OnboardingResponseDto> {
    return this.service.setOnboarding(auth, Onboarding);
  }

  @Delete('me/onboarding')
  @Authenticated({ permission: Permission.UserOnboardingDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete user onboarding',
    description: 'Delete the onboarding status of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async deleteUserOnboarding(@Auth() auth: AuthDto): Promise<void> {
    await this.service.deleteOnboarding(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Retrieve a user',
    description: 'Retrieve a specific user by their ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUser(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Post('profile-image')
  @Authenticated({ permission: Permission.UserProfileImageUpdate })
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Endpoint({
    summary: 'Create user profile image',
    description: 'Upload and set a new profile image for the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(auth, fileInfo);
  }

  @Delete('profile-image')
  @Authenticated({ permission: Permission.UserProfileImageDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete user profile image',
    description: 'Delete the profile image of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
  }

  @Get(':id/profile-image')
  @FileResponse()
  @Authenticated({ permission: Permission.UserProfileImageRead })
  @Endpoint({
    summary: 'Retrieve user profile image',
    description: 'Retrieve the profile image file for a user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async getProfileImage(@Res() res: Response, @Next() next: NextFunction, @Param() { id }: UUIDParamDto) {
    await sendFile(res, next, () => this.service.getProfileImage(id), this.logger);
  }
}
