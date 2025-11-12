import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetStatsDto, AssetStatsResponseDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { SessionResponseDto } from 'src/dtos/session.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import {
  UserAdminCreateDto,
  UserAdminDeleteDto,
  UserAdminResponseDto,
  UserAdminSearchDto,
  UserAdminUpdateDto,
} from 'src/dtos/user.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { UserAdminService } from 'src/services/user-admin.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.UsersAdmin)
@Controller('admin/users')
export class UserAdminController {
  constructor(private service: UserAdminService) {}

  @Get()
  @Authenticated({ permission: Permission.AdminUserRead, admin: true })
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users.',
  })
  searchUsersAdmin(@Auth() auth: AuthDto, @Query() dto: UserAdminSearchDto): Promise<UserAdminResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.AdminUserCreate, admin: true })
  @ApiOperation({
    summary: 'Create a user',
    description: 'Create a new user.',
  })
  createUserAdmin(@Body() createUserDto: UserAdminCreateDto): Promise<UserAdminResponseDto> {
    return this.service.create(createUserDto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AdminUserRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve a user',
    description: 'Retrieve  a specific user by their ID.',
  })
  getUserAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserAdminResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AdminUserUpdate, admin: true })
  @ApiOperation({
    summary: 'Update a user',
    description: 'Update an existing user.',
  })
  updateUserAdmin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UserAdminUpdateDto,
  ): Promise<UserAdminResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.AdminUserDelete, admin: true })
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Delete a user.',
  })
  deleteUserAdmin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UserAdminDeleteDto,
  ): Promise<UserAdminResponseDto> {
    return this.service.delete(auth, id, dto);
  }

  @Get(':id/sessions')
  @Authenticated({ permission: Permission.AdminSessionRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve user sessions',
    description: 'Retrieve all sessions for a specific user.',
  })
  getUserSessionsAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SessionResponseDto[]> {
    return this.service.getSessions(auth, id);
  }

  @Get(':id/statistics')
  @Authenticated({ permission: Permission.AdminUserRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve user statistics',
    description: 'Retrieve asset statistics for a specific user.',
  })
  getUserStatisticsAdmin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: AssetStatsDto,
  ): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, id, dto);
  }

  @Get(':id/preferences')
  @Authenticated({ permission: Permission.AdminUserRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve user preferences',
    description: 'Retrieve the preferences of a specific user.',
  })
  getUserPreferencesAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserPreferencesResponseDto> {
    return this.service.getPreferences(auth, id);
  }

  @Put(':id/preferences')
  @Authenticated({ permission: Permission.AdminUserUpdate, admin: true })
  @ApiOperation({
    summary: 'Update user preferences',
    description: 'Update the preferences of a specific user.',
  })
  updateUserPreferencesAdmin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UserPreferencesUpdateDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.service.updatePreferences(auth, id, dto);
  }

  @Post(':id/restore')
  @Authenticated({ permission: Permission.AdminUserDelete, admin: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore a deleted user',
    description: 'Restore a previously deleted user.',
  })
  restoreUserAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserAdminResponseDto> {
    return this.service.restore(auth, id);
  }
}
