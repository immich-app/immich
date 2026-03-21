import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  UserGroupCreateDto,
  UserGroupMemberResponseDto,
  UserGroupMemberSetDto,
  UserGroupResponseDto,
  UserGroupUpdateDto,
} from 'src/dtos/user-group.dto';
import { UserAvatarColor } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class UserGroupService extends BaseService {
  async create(auth: AuthDto, dto: UserGroupCreateDto): Promise<UserGroupResponseDto> {
    const group = await this.userGroupRepository.create({
      name: dto.name,
      color: dto.color ?? null,
      createdById: auth.user.id,
    });

    return this.mapGroup(group, []);
  }

  async getAll(auth: AuthDto): Promise<UserGroupResponseDto[]> {
    const groups = await this.userGroupRepository.getAllByUserId(auth.user.id);

    const results: UserGroupResponseDto[] = [];
    for (const group of groups) {
      const members = await this.userGroupRepository.getMembers(group.id);
      results.push(this.mapGroup(group, members));
    }
    return results;
  }

  async get(auth: AuthDto, id: string): Promise<UserGroupResponseDto> {
    const group = await this.requireOwnership(auth, id);
    const members = await this.userGroupRepository.getMembers(id);
    return this.mapGroup(group, members);
  }

  async update(auth: AuthDto, id: string, dto: UserGroupUpdateDto): Promise<UserGroupResponseDto> {
    await this.requireOwnership(auth, id);

    const group = await this.userGroupRepository.update(id, {
      name: dto.name,
      color: dto.color,
    });

    const members = await this.userGroupRepository.getMembers(id);
    return this.mapGroup(group, members);
  }

  async setMembers(auth: AuthDto, id: string, dto: UserGroupMemberSetDto): Promise<UserGroupMemberResponseDto[]> {
    await this.requireOwnership(auth, id);
    const uniqueUserIds = [...new Set(dto.userIds)];
    await this.userGroupRepository.setMembers(id, uniqueUserIds);
    const members = await this.userGroupRepository.getMembers(id);
    return members.map((m) => this.mapMember(m));
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireOwnership(auth, id);
    await this.userGroupRepository.remove(id);
  }

  private async requireOwnership(auth: AuthDto, groupId: string) {
    const group = await this.userGroupRepository.getById(groupId);
    if (!group) {
      throw new NotFoundException('User group not found');
    }
    if (group.createdById !== auth.user.id) {
      throw new ForbiddenException('Not the owner of this group');
    }
    return group;
  }

  private mapGroup(
    group: { id: string; name: string; color: string | null; origin: string; createdAt: Date },
    members: Array<{
      userId: string;
      name: string;
      email: string;
      profileImagePath: string;
      avatarColor: string | null;
    }>,
  ): UserGroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      color: (group.color as UserAvatarColor) ?? null,
      origin: group.origin,
      createdAt: group.createdAt.toISOString(),
      members: members.map((m) => this.mapMember(m)),
    };
  }

  private mapMember(member: {
    userId: string;
    name: string;
    email: string;
    profileImagePath: string;
    avatarColor: string | null;
  }): UserGroupMemberResponseDto {
    return {
      userId: member.userId,
      name: member.name,
      email: member.email,
      profileImagePath: member.profileImagePath,
      avatarColor: member.avatarColor ?? undefined,
    };
  }
}
