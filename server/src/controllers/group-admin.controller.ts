import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { GroupUserCreateAllDto, GroupUserDeleteAllDto, GroupUserResponseDto } from 'src/dtos/group-user.dto';
import {
  GroupAdminCreateDto,
  GroupAdminResponseDto,
  GroupAdminSearchDto,
  GroupAdminUpdateDto,
} from 'src/dtos/group.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { GroupAdminService } from 'src/services/group-admin.service';
import { UserIdAndIdParamDto, UUIDParamDto } from 'src/validation';

@ApiTags('Groups (admin)')
@Controller('admin/groups')
export class GroupAdminController {
  constructor(private service: GroupAdminService) {}

  @Get()
  @Authenticated({ permission: Permission.AdminGroupRead, admin: true })
  searchGroupsAdmin(@Auth() auth: AuthDto, @Query() dto: GroupAdminSearchDto): Promise<GroupAdminResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.AdminGroupCreate, admin: true })
  createGroupAdmin(@Auth() auth: AuthDto, @Body() dto: GroupAdminCreateDto): Promise<GroupAdminResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AdminGroupRead, admin: true })
  getGroupAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<GroupAdminResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AdminGroupUpdate, admin: true })
  updateGroupAdmin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: GroupAdminUpdateDto,
  ): Promise<GroupAdminResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.AdminGroupDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGroupAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/users')
  @Authenticated({ permission: Permission.AdminGroupUserRead, admin: true })
  getUsersForGroupAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<GroupUserResponseDto[]> {
    return this.service.getUsers(auth, id);
  }

  @Put(':id/users')
  @Authenticated({ permission: Permission.AdminGroupUserCreate, admin: true })
  addUsersToGroupAdmin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: GroupUserCreateAllDto,
  ): Promise<GroupUserResponseDto[]> {
    return this.service.addUsers(auth, id, dto);
  }

  @Delete(':id/user')
  @Authenticated({ permission: Permission.AdminGroupUserDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUsersFromGroupAdmin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: GroupUserDeleteAllDto) {
    return this.service.removeUsers(auth, id, dto);
  }

  @Delete(':id/user/:userId')
  @Authenticated({ permission: Permission.AdminGroupUserDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUserFromGroupAdmin(@Auth() auth: AuthDto, @Param() { id, userId }: UserIdAndIdParamDto) {
    return this.service.removeUser(auth, id, userId);
  }
}
