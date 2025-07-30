import { Controller, Delete, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { GroupUserResponseDto } from 'src/dtos/group-user.dto';
import { GroupResponseDto } from 'src/dtos/group.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { GroupService } from 'src/services/group.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Groups')
@Controller('groups')
export class GroupController {
  constructor(private service: GroupService) {}

  @Get()
  @Authenticated({ permission: Permission.GroupRead })
  searchMyGroups(@Auth() auth: AuthDto): Promise<GroupResponseDto[]> {
    return this.service.search(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.GroupRead })
  getMyGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<GroupResponseDto> {
    return this.service.get(auth, id);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.GroupDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveMyGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(auth, id);
  }

  @Get(':id/users')
  @Authenticated({ permission: Permission.GroupRead, admin: true })
  getMyGroupUsers(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<GroupUserResponseDto[]> {
    return this.service.getUsers(auth, id);
  }
}
