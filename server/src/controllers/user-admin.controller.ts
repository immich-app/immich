import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @Endpoint({
    summary: 'Search users',
    description: 'Search for users.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchUsersAdmin(@Auth() auth: AuthDto, @Query() dto: UserAdminSearchDto): Promise<UserAdminResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.AdminUserCreate, admin: true })
  @Endpoint({
    summary: 'Create a user',
    description: 'Create a new user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createUserAdmin(@Body() createUserDto: UserAdminCreateDto): Promise<UserAdminResponseDto> {
    return this.service.create(createUserDto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AdminUserRead, admin: true })
  @Endpoint({
    summary: 'Retrieve a user',
    description: 'Retrieve  a specific user by their ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUserAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserAdminResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AdminUserUpdate, admin: true })
  @Endpoint({
    summary: 'Update a user',
    description: 'Update an existing user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Delete a user',
    description: 'Delete a user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Retrieve user sessions',
    description: 'Retrieve all sessions for a specific user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUserSessionsAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SessionResponseDto[]> {
    return this.service.getSessions(auth, id);
  }

  @Get(':id/statistics')
  @Authenticated({ permission: Permission.AdminUserRead, admin: true })
  @Endpoint({
    summary: 'Retrieve user statistics',
    description: 'Retrieve asset statistics for a specific user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Retrieve user preferences',
    description: 'Retrieve the preferences of a specific user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUserPreferencesAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserPreferencesResponseDto> {
    return this.service.getPreferences(auth, id);
  }

  @Put(':id/preferences')
  @Authenticated({ permission: Permission.AdminUserUpdate, admin: true })
  @Endpoint({
    summary: 'Update user preferences',
    description: 'Update the preferences of a specific user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Restore a deleted user',
    description: 'Restore a previously deleted user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  restoreUserAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserAdminResponseDto> {
    return this.service.restore(auth, id);
  }
}
