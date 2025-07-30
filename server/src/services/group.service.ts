import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { GroupUserResponseDto, mapGroupUser } from 'src/dtos/group-user.dto';
import { GroupResponseDto, mapGroup } from 'src/dtos/group.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class GroupService extends BaseService {
  async search(auth: AuthDto): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.search({ userId: auth.user.id });
    return groups.map((group) => mapGroup(group));
  }

  async get(auth: AuthDto, id: string): Promise<GroupResponseDto> {
    const group = await this.findOrFail({ userId: auth.user.id, groupId: id });
    return mapGroup(group);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.findOrFail({ userId: auth.user.id, groupId: id });
    await this.groupUserRepository.delete({ userId: auth.user.id, groupId: id });
  }

  async getUsers(auth: AuthDto, id: string): Promise<GroupUserResponseDto[]> {
    await this.findOrFail({ userId: auth.user.id, groupId: id });
    const users = await this.groupUserRepository.getAll(id);
    return users.map((user) => mapGroupUser(user));
  }

  async findOrFail({ userId, groupId }: { userId: string; groupId: string }): Promise<GroupResponseDto> {
    const [group] = await this.groupUserRepository.get({ userId, groupId });
    if (!group) {
      throw new BadRequestException('Group not found');
    }

    return group;
  }
}
