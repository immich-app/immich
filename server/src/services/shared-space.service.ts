import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SharedSpacePerson } from 'src/database';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { mapNotification } from 'src/dtos/notification.dto';
import {
  SharedSpacePersonAliasDto,
  SharedSpacePersonMergeDto,
  SharedSpacePersonResponseDto,
  SharedSpacePersonUpdateDto,
  SpacePeopleQueryDto,
} from 'src/dtos/shared-space-person.dto';
import {
  SharedSpaceActivityResponseDto,
  SharedSpaceAssetAddDto,
  SharedSpaceAssetRemoveDto,
  SharedSpaceCreateDto,
  SharedSpaceLibraryLinkDto,
  SharedSpaceLinkedLibraryDto,
  SharedSpaceMemberCreateDto,
  SharedSpaceMemberResponseDto,
  SharedSpaceMemberTimelineDto,
  SharedSpaceMemberUpdateDto,
  SharedSpaceResponseDto,
  SharedSpaceUpdateDto,
} from 'src/dtos/shared-space.dto';
import {
  CacheControl,
  JobName,
  JobStatus,
  NotificationLevel,
  NotificationType,
  Permission,
  QueueName,
  SharedSpaceActivityType,
  SharedSpaceRole,
  UserAvatarColor,
} from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { ImmichMediaResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';

const ROLE_HIERARCHY: Record<SharedSpaceRole, number> = {
  [SharedSpaceRole.Viewer]: 0,
  [SharedSpaceRole.Editor]: 1,
  [SharedSpaceRole.Owner]: 2,
};

@Injectable()
export class SharedSpaceService extends BaseService {
  async create(auth: AuthDto, dto: SharedSpaceCreateDto): Promise<SharedSpaceResponseDto> {
    const space = await this.sharedSpaceRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? 'primary',
      createdById: auth.user.id,
    });

    await this.sharedSpaceRepository.addMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    return this.mapSpace(space);
  }

  async getAll(auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
    const spaces = await this.sharedSpaceRepository.getAllByUserId(auth.user.id);

    const results: SharedSpaceResponseDto[] = [];
    for (const space of spaces) {
      const members = await this.sharedSpaceRepository.getMembers(space.id);
      const assetCount = await this.sharedSpaceRepository.getAssetCount(space.id);
      const recentAssets = await this.sharedSpaceRepository.getRecentAssets(space.id);

      // Recency badge data
      const membership = await this.sharedSpaceRepository.getMember(space.id, auth.user.id);
      let newAssetCount: number;
      let lastContributor: { id: string; name: string } | null = null;

      if (membership?.lastViewedAt) {
        newAssetCount = await this.sharedSpaceRepository.getNewAssetCount(space.id, membership.lastViewedAt);
        if (newAssetCount > 0) {
          const contributor = await this.sharedSpaceRepository.getLastContributor(space.id, membership.lastViewedAt);
          lastContributor = contributor ?? null;
        }
      } else {
        newAssetCount = assetCount;
      }

      let linkedLibraries: SharedSpaceLinkedLibraryDto[] | undefined;
      if (auth.user.isAdmin) {
        const links = await this.sharedSpaceRepository.getLinkedLibraries(space.id);
        linkedLibraries = [];
        for (const link of links) {
          const library = await this.libraryRepository.get(link.libraryId);
          if (library) {
            linkedLibraries.push({
              libraryId: link.libraryId,
              libraryName: library.name,
              addedById: link.addedById,
              createdAt: link.createdAt as unknown as Date,
            });
          }
        }
      }

      results.push({
        ...this.mapSpace(space),
        memberCount: members.length,
        assetCount,
        recentAssetIds: recentAssets.map((a) => a.id),
        recentAssetThumbhashes: recentAssets.map((a) =>
          a.thumbhash ? Buffer.from(a.thumbhash).toString('base64') : null,
        ),
        members: members.map((m) => this.mapMember(m)),
        newAssetCount,
        lastContributor,
        linkedLibraries,
      });
    }
    return results;
  }

  async get(auth: AuthDto, id: string): Promise<SharedSpaceResponseDto> {
    const membership = await this.requireMembership(auth, id);

    const space = await this.sharedSpaceRepository.getById(id);
    if (!space) {
      throw new BadRequestException('Shared space not found');
    }

    const members = await this.sharedSpaceRepository.getMembers(id);
    const assetCount = await this.sharedSpaceRepository.getAssetCount(id);
    const recentAssets = await this.sharedSpaceRepository.getRecentAssets(id);

    let { thumbnailAssetId } = space;
    if (thumbnailAssetId) {
      const activeIds = new Set(recentAssets.map((a) => a.id));
      if (assetCount === 0 || (assetCount <= activeIds.size && !activeIds.has(thumbnailAssetId))) {
        thumbnailAssetId = null;
        await this.sharedSpaceRepository.update(id, { thumbnailAssetId: null });
      }
    }

    let newAssetCount = 0;
    if (membership.lastViewedAt) {
      newAssetCount = await this.sharedSpaceRepository.getNewAssetCount(id, membership.lastViewedAt);
    }

    let linkedLibraries: SharedSpaceLinkedLibraryDto[] | undefined;
    if (auth.user.isAdmin) {
      const links = await this.sharedSpaceRepository.getLinkedLibraries(space.id);
      linkedLibraries = [];
      for (const link of links) {
        const library = await this.libraryRepository.get(link.libraryId);
        if (library) {
          linkedLibraries.push({
            libraryId: link.libraryId,
            libraryName: library.name,
            addedById: link.addedById,
            createdAt: link.createdAt as unknown as Date,
          });
        }
      }
    }

    return {
      ...this.mapSpace(space),
      thumbnailAssetId,
      memberCount: members.length,
      assetCount,
      recentAssetIds: recentAssets.map((a) => a.id),
      recentAssetThumbhashes: recentAssets.map((a) =>
        a.thumbhash ? Buffer.from(a.thumbhash).toString('base64') : null,
      ),
      members: members.map((m) => this.mapMember(m)),
      newAssetCount,
      lastViewedAt: membership.lastViewedAt ? (membership.lastViewedAt as unknown as Date).toISOString() : null,
      linkedLibraries,
    };
  }

  async update(auth: AuthDto, id: string, dto: SharedSpaceUpdateDto): Promise<SharedSpaceResponseDto> {
    const isMetadataUpdate =
      dto.name !== undefined ||
      dto.description !== undefined ||
      dto.color !== undefined ||
      dto.faceRecognitionEnabled !== undefined ||
      dto.petsEnabled !== undefined;
    const minimumRole = isMetadataUpdate ? SharedSpaceRole.Owner : SharedSpaceRole.Editor;
    await this.requireRole(auth, id, minimumRole);

    // Validate thumbnail asset belongs to the space
    if (dto.thumbnailAssetId !== undefined && dto.thumbnailAssetId !== null) {
      const isInSpace = await this.sharedSpaceRepository.isAssetInSpace(id, dto.thumbnailAssetId);
      if (!isInSpace) {
        throw new BadRequestException('Thumbnail asset must belong to the space');
      }
    }

    // Reset crop position when cover photo changes
    const thumbnailCropY = dto.thumbnailAssetId === undefined ? dto.thumbnailCropY : null;

    const existing = await this.sharedSpaceRepository.getById(id);
    const space = await this.sharedSpaceRepository.update(id, {
      name: dto.name,
      description: dto.description,
      thumbnailAssetId: dto.thumbnailAssetId,
      thumbnailCropY,
      color: dto.color,
      faceRecognitionEnabled: dto.faceRecognitionEnabled,
      petsEnabled: dto.petsEnabled,
    });

    if (existing) {
      if (dto.name !== undefined && dto.name !== existing.name) {
        await this.sharedSpaceRepository.logActivity({
          spaceId: id,
          userId: auth.user.id,
          type: SharedSpaceActivityType.SpaceRename,
          data: { oldName: existing.name, newName: dto.name },
        });
      }
      if (dto.color !== undefined && dto.color !== existing.color) {
        await this.sharedSpaceRepository.logActivity({
          spaceId: id,
          userId: auth.user.id,
          type: SharedSpaceActivityType.SpaceColorChange,
          data: { oldColor: existing.color, newColor: dto.color },
        });
      }
      if (dto.thumbnailAssetId !== undefined && dto.thumbnailAssetId !== existing.thumbnailAssetId) {
        await this.sharedSpaceRepository.logActivity({
          spaceId: id,
          userId: auth.user.id,
          type: SharedSpaceActivityType.CoverChange,
          data: { assetId: dto.thumbnailAssetId },
        });
      }

      // Queue face matching when toggling from disabled to enabled
      if (dto.faceRecognitionEnabled === true && !existing.faceRecognitionEnabled) {
        await this.jobRepository.queue({
          name: JobName.SharedSpaceFaceMatchAll,
          data: { spaceId: id },
        });
      }
    }

    return this.mapSpace(space);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireRole(auth, id, SharedSpaceRole.Owner);
    await this.sharedSpaceRepository.remove(id);
  }

  async getMembers(auth: AuthDto, spaceId: string): Promise<SharedSpaceMemberResponseDto[]> {
    await this.requireMembership(auth, spaceId);

    const members = await this.sharedSpaceRepository.getMembers(spaceId);
    const contributions = await this.sharedSpaceRepository.getContributionCounts(spaceId);
    const activity = await this.sharedSpaceRepository.getMemberActivity(spaceId);

    const countMap = new Map(contributions.map((c) => [c.addedById, Number(c.count)]));
    const activityMap = new Map(activity.map((a) => [a.addedById, a]));

    const enriched = members.map((member) => ({
      ...this.mapMember(member),
      contributionCount: countMap.get(member.userId) ?? 0,
      lastActiveAt: activityMap.get(member.userId)?.lastAddedAt
        ? (activityMap.get(member.userId)!.lastAddedAt as unknown as Date).toISOString()
        : null,
      recentAssetId: activityMap.get(member.userId)?.recentAssetId ?? null,
    }));

    // Sort: owner first, then by contribution count desc
    return enriched.toSorted((a, b) => {
      const aIsOwner = a.role === SharedSpaceRole.Owner ? 1 : 0;
      const bIsOwner = b.role === SharedSpaceRole.Owner ? 1 : 0;
      if (aIsOwner !== bIsOwner) {
        return bIsOwner - aIsOwner;
      }
      return (b.contributionCount ?? 0) - (a.contributionCount ?? 0);
    });
  }

  async addMember(
    auth: AuthDto,
    spaceId: string,
    dto: SharedSpaceMemberCreateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);

    const existing = await this.sharedSpaceRepository.getMember(spaceId, dto.userId);
    if (existing) {
      throw new BadRequestException('User is already a member of this space');
    }

    const role = dto.role ?? SharedSpaceRole.Viewer;
    await this.sharedSpaceRepository.addMember({ spaceId, userId: dto.userId, role });

    const member = await this.sharedSpaceRepository.getMember(spaceId, dto.userId);
    if (!member) {
      throw new BadRequestException('Failed to add member');
    }

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: dto.userId,
      type: SharedSpaceActivityType.MemberJoin,
      data: { role, invitedById: auth.user.id },
    });

    return this.mapMember(member);
  }

  async updateMember(
    auth: AuthDto,
    spaceId: string,
    userId: string,
    dto: SharedSpaceMemberUpdateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);

    if (auth.user.id === userId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const existingMember = await this.sharedSpaceRepository.getMember(spaceId, userId);
    if (!existingMember) {
      throw new BadRequestException('Member not found');
    }

    const oldRole = existingMember.role;
    await this.sharedSpaceRepository.updateMember(spaceId, userId, { role: dto.role });

    const member = await this.sharedSpaceRepository.getMember(spaceId, userId);
    if (!member) {
      throw new BadRequestException('Member not found');
    }

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.MemberRoleChange,
      data: { targetUserId: userId, oldRole, newRole: dto.role },
    });

    return this.mapMember(member);
  }

  async updateMemberTimeline(
    auth: AuthDto,
    spaceId: string,
    dto: SharedSpaceMemberTimelineDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    await this.requireMembership(auth, spaceId);

    await this.sharedSpaceRepository.updateMember(spaceId, auth.user.id, {
      showInTimeline: dto.showInTimeline,
    });

    const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
    if (!member) {
      throw new BadRequestException('Member not found');
    }

    return this.mapMember(member);
  }

  async removeMember(auth: AuthDto, spaceId: string, userId: string): Promise<void> {
    const isSelf = auth.user.id === userId;

    if (isSelf) {
      const member = await this.requireMembership(auth, spaceId);
      if (member.role === SharedSpaceRole.Owner) {
        throw new BadRequestException('Owner cannot leave the space');
      }
      await this.sharedSpaceRepository.removeMember(spaceId, userId);
      await this.sharedSpaceRepository.logActivity({
        spaceId,
        userId,
        type: SharedSpaceActivityType.MemberLeave,
        data: {},
      });
      return;
    }

    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);
    await this.sharedSpaceRepository.removeMember(spaceId, userId);
    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.MemberRemove,
      data: { removedUserId: userId },
    });
  }

  async addAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetAddDto): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: dto.assetIds });
    const inserted = await this.sharedSpaceRepository.addAssets(
      dto.assetIds.map((assetId) => ({ spaceId, assetId, addedById: auth.user.id })),
    );

    await this.sharedSpaceRepository.update(spaceId, { lastActivityAt: new Date() });

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.AssetAdd,
      data: { count: inserted.length, assetIds: dto.assetIds.slice(0, 4) },
    });

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (space?.faceRecognitionEnabled) {
      await this.jobRepository.queueAll(
        dto.assetIds.map((assetId) => ({
          name: JobName.SharedSpaceFaceMatch as const,
          data: { spaceId, assetId },
        })),
      );
    }
  }

  async queueBulkAdd(auth: AuthDto, spaceId: string): Promise<{ spaceId: string }> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
    await this.jobRepository.queue({
      name: JobName.SharedSpaceBulkAddAssets,
      data: { spaceId, userId: auth.user.id },
    });
    return { spaceId };
  }

  async linkLibrary(auth: AuthDto, spaceId: string, dto: SharedSpaceLibraryLinkDto): Promise<void> {
    if (!auth.user.isAdmin) {
      throw new ForbiddenException('Only admins can link libraries to spaces');
    }

    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const library = await this.libraryRepository.get(dto.libraryId);
    if (!library) {
      throw new BadRequestException('Library not found');
    }

    const result = await this.sharedSpaceRepository.addLibrary({
      spaceId,
      libraryId: dto.libraryId,
      addedById: auth.user.id,
    });

    // Only queue face sync for newly created links (not duplicates)
    if (result) {
      const space = await this.sharedSpaceRepository.getById(spaceId);
      if (space?.faceRecognitionEnabled) {
        await this.jobRepository.queue({
          name: JobName.SharedSpaceLibraryFaceSync,
          data: { spaceId, libraryId: dto.libraryId },
        });
      }
    }
  }

  async unlinkLibrary(auth: AuthDto, spaceId: string, libraryId: string): Promise<void> {
    if (!auth.user.isAdmin) {
      throw new ForbiddenException('Only admins can unlink libraries from spaces');
    }

    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    await this.sharedSpaceRepository.removeLibrary(spaceId, libraryId);
  }

  async markSpaceViewed(auth: AuthDto, spaceId: string): Promise<void> {
    await this.requireMembership(auth, spaceId);
    await this.sharedSpaceRepository.updateMemberLastViewed(spaceId, auth.user.id);
  }

  async getActivities(
    auth: AuthDto,
    spaceId: string,
    query: { limit?: number; offset?: number },
  ): Promise<SharedSpaceActivityResponseDto[]> {
    await this.requireMembership(auth, spaceId);

    const activities = await this.sharedSpaceRepository.getActivities(spaceId, query.limit ?? 50, query.offset ?? 0);

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      data: a.data as Record<string, unknown>,
      createdAt: (a.createdAt as unknown as Date).toISOString(),
      userId: a.userId,
      userName: a.name,
      userEmail: a.email,
      userProfileImagePath: a.profileImagePath,
      userAvatarColor: a.avatarColor,
    }));
  }

  async removeAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetRemoveDto): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }
    await this.sharedSpaceRepository.removeAssets(spaceId, dto.assetIds);

    const lastAddedAt = await this.sharedSpaceRepository.getLastAssetAddedAt(spaceId);
    const updateData: { lastActivityAt: Date | null; thumbnailAssetId?: null } = {
      lastActivityAt: lastAddedAt ?? null,
    };

    if (space?.thumbnailAssetId && dto.assetIds.includes(space.thumbnailAssetId)) {
      updateData.thumbnailAssetId = null;
    }

    await this.sharedSpaceRepository.update(spaceId, updateData);

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.AssetRemove,
      data: { count: dto.assetIds.length },
    });

    await this.sharedSpaceRepository.removePersonFacesByAssetIds(spaceId, dto.assetIds);
    await this.sharedSpaceRepository.deleteOrphanedPersons(spaceId);
  }

  async getMapMarkers(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [id] });

    const markers = await this.sharedSpaceRepository.getMapMarkers(id);
    return markers.map((marker) => ({
      id: marker.id,
      lat: marker.latitude!,
      lon: marker.longitude!,
      city: marker.city ?? null,
      state: marker.state ?? null,
      country: marker.country ?? null,
    }));
  }

  async getSpacePeople(
    auth: AuthDto,
    spaceId: string,
    query?: SpacePeopleQueryDto,
  ): Promise<SharedSpacePersonResponseDto[]> {
    await this.requireMembership(auth, spaceId);

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space?.faceRecognitionEnabled) {
      return [];
    }

    const hasTemporal = query?.takenAfter || query?.takenBefore;
    const persons = hasTemporal
      ? await this.sharedSpaceRepository.getPersonsBySpaceIdWithTemporalFilter(spaceId, query)
      : await this.sharedSpaceRepository.getPersonsBySpaceId(spaceId);
    const aliases = await this.sharedSpaceRepository.getAliasesBySpaceAndUser(spaceId, auth.user.id);
    const aliasMap = new Map(aliases.map((a) => [a.personId, a.alias]));

    const results: SharedSpacePersonResponseDto[] = [];
    for (const person of persons) {
      if (!space.petsEnabled && person.type === 'pet') {
        continue;
      }
      if (!person.thumbnailPath) {
        continue;
      }
      const faceCount = await this.sharedSpaceRepository.getPersonFaceCount(person.id);
      const assetCount = await this.sharedSpaceRepository.getPersonAssetCount(person.id);
      results.push(this.mapSpacePerson(person, faceCount, assetCount, aliasMap.get(person.id) ?? null));
    }

    return results.toSorted((a, b) => b.assetCount - a.assetCount);
  }

  async getSpacePerson(auth: AuthDto, spaceId: string, personId: string): Promise<SharedSpacePersonResponseDto> {
    await this.requireMembership(auth, spaceId);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space?.petsEnabled && person.type === 'pet') {
      throw new BadRequestException('Person not found');
    }

    const faceCount = await this.sharedSpaceRepository.getPersonFaceCount(personId);
    const assetCount = await this.sharedSpaceRepository.getPersonAssetCount(personId);
    const alias = await this.sharedSpaceRepository.getAlias(personId, auth.user.id);

    return this.mapSpacePerson(person, faceCount, assetCount, alias?.alias ?? null);
  }

  async getSpacePersonThumbnail(auth: AuthDto, spaceId: string, personId: string): Promise<ImmichMediaResponse> {
    await this.requireMembership(auth, spaceId);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new NotFoundException();
    }

    let thumbnailPath = person.thumbnailPath;

    // Fall back to the personal person's thumbnail if the space person's path is missing
    if (!thumbnailPath && person.representativeFaceId) {
      const face = await this.personRepository.getFaceById(person.representativeFaceId);
      if (face?.personId) {
        const personalPerson = await this.personRepository.getById(face.personId);
        if (personalPerson?.thumbnailPath) {
          thumbnailPath = personalPerson.thumbnailPath;
          // Persist for next time so the fallback isn't needed again
          await this.sharedSpaceRepository.updatePerson(personId, { thumbnailPath });
        }
      }
    }

    if (!thumbnailPath) {
      throw new NotFoundException();
    }

    return this.serveFromBackend(thumbnailPath, mimeTypes.lookup(thumbnailPath), CacheControl.PrivateWithoutCache);
  }

  async updateSpacePerson(
    auth: AuthDto,
    spaceId: string,
    personId: string,
    dto: SharedSpacePersonUpdateDto,
  ): Promise<SharedSpacePersonResponseDto> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    if (dto.representativeFaceId) {
      const isInSpace = await this.sharedSpaceRepository.isFaceInSpace(spaceId, dto.representativeFaceId);
      if (!isInSpace) {
        throw new BadRequestException('Representative face must belong to an asset in the space');
      }
    }

    const updated = await this.sharedSpaceRepository.updatePerson(personId, {
      name: dto.name,
      isHidden: dto.isHidden,
      birthDate: dto.birthDate,
      representativeFaceId: dto.representativeFaceId,
    });

    const faceCount = await this.sharedSpaceRepository.getPersonFaceCount(personId);
    const assetCount = await this.sharedSpaceRepository.getPersonAssetCount(personId);
    const alias = await this.sharedSpaceRepository.getAlias(personId, auth.user.id);

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonUpdate,
      data: { personId },
    });

    return this.mapSpacePerson(updated, faceCount, assetCount, alias?.alias ?? null);
  }

  async deleteSpacePerson(auth: AuthDto, spaceId: string, personId: string): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    await this.sharedSpaceRepository.deletePerson(personId);

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonDelete,
      data: { personId, personName: person.name },
    });
  }

  async mergeSpacePeople(
    auth: AuthDto,
    spaceId: string,
    targetPersonId: string,
    dto: SharedSpacePersonMergeDto,
  ): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const target = await this.sharedSpaceRepository.getPersonById(targetPersonId);
    if (!target || target.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    if (dto.ids.includes(targetPersonId)) {
      throw new BadRequestException('Cannot merge a person into themselves');
    }

    const sources = [];
    for (const sourceId of dto.ids) {
      const source = await this.sharedSpaceRepository.getPersonById(sourceId);
      if (!source || source.spaceId !== spaceId) {
        throw new BadRequestException('Source person not found in this space');
      }
      sources.push(source);
      if (source.type !== target.type) {
        throw new BadRequestException('Cannot merge people of different types');
      }
    }

    for (const source of sources) {
      await this.sharedSpaceRepository.reassignPersonFaces(source.id, targetPersonId);
      await this.sharedSpaceRepository.deletePerson(source.id);
    }

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonMerge,
      data: { targetPersonId, mergedCount: sources.length },
    });
  }

  async setSpacePersonAlias(
    auth: AuthDto,
    spaceId: string,
    personId: string,
    dto: SharedSpacePersonAliasDto,
  ): Promise<void> {
    await this.requireMembership(auth, spaceId);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    await this.sharedSpaceRepository.upsertAlias({
      personId,
      userId: auth.user.id,
      alias: dto.alias,
    });
  }

  async deleteSpacePersonAlias(auth: AuthDto, spaceId: string, personId: string): Promise<void> {
    await this.requireMembership(auth, spaceId);
    await this.sharedSpaceRepository.deleteAlias(personId, auth.user.id);
  }

  async getSpacePersonAssets(auth: AuthDto, spaceId: string, personId: string): Promise<string[]> {
    await this.requireMembership(auth, spaceId);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    const assets = await this.sharedSpaceRepository.getPersonAssetIds(personId);
    return assets.map((a) => a.assetId);
  }

  @OnJob({ name: JobName.SharedSpaceFaceMatch, queue: QueueName.FacialRecognition })
  async handleSharedSpaceFaceMatch({ spaceId, assetId }: JobOf<JobName.SharedSpaceFaceMatch>): Promise<JobStatus> {
    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space || !space.faceRecognitionEnabled) {
      return JobStatus.Skipped;
    }

    await this.processSpaceFaceMatch(spaceId, assetId);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpaceLibraryFaceSync, queue: QueueName.FacialRecognition })
  async handleSharedSpaceLibraryFaceSync(job: JobOf<JobName.SharedSpaceLibraryFaceSync>): Promise<JobStatus> {
    const space = await this.sharedSpaceRepository.getById(job.spaceId);
    if (!space || !space.faceRecognitionEnabled) {
      return JobStatus.Skipped;
    }

    const linkExists = await this.sharedSpaceRepository.hasLibraryLink(job.spaceId, job.libraryId);
    if (!linkExists) {
      return JobStatus.Skipped;
    }

    const batchSize = 1000;
    let offset = 0;

    while (true) {
      const assets = await this.assetRepository.getByLibraryIdWithFaces(job.libraryId, batchSize, offset);
      if (assets.length === 0) {
        break;
      }

      for (const asset of assets) {
        await this.processSpaceFaceMatch(job.spaceId, asset.id);
      }

      offset += assets.length;
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpaceFaceMatchAll, queue: QueueName.FacialRecognition })
  async handleSharedSpaceFaceMatchAll({ spaceId }: JobOf<JobName.SharedSpaceFaceMatchAll>): Promise<JobStatus> {
    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space || !space.faceRecognitionEnabled) {
      return JobStatus.Skipped;
    }

    const assets = await this.sharedSpaceRepository.getAssetIdsInSpace(spaceId);
    await this.jobRepository.queueAll(
      assets.map(({ assetId }) => ({
        name: JobName.SharedSpaceFaceMatch as const,
        data: { spaceId, assetId },
      })),
    );

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpaceBulkAddAssets, queue: QueueName.BackgroundTask })
  async handleSharedSpaceBulkAddAssets({
    spaceId,
    userId,
  }: JobOf<JobName.SharedSpaceBulkAddAssets>): Promise<JobStatus> {
    const member = await this.sharedSpaceRepository.getMember(spaceId, userId);
    if (!member || ROLE_HIERARCHY[member.role as SharedSpaceRole] < ROLE_HIERARCHY[SharedSpaceRole.Editor]) {
      return JobStatus.Skipped;
    }

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space) {
      return JobStatus.Skipped;
    }

    let count: number;
    try {
      count = await this.sharedSpaceRepository.bulkAddUserAssets(spaceId, userId);
    } catch (error) {
      this.logger.error(`Bulk add assets failed for space ${spaceId}: ${error}`);
      return JobStatus.Failed;
    }

    if (count === 0) {
      return JobStatus.Success;
    }

    await this.sharedSpaceRepository.update(spaceId, { lastActivityAt: new Date() });

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId,
      type: SharedSpaceActivityType.AssetAdd,
      data: { count, bulk: true },
    });

    if (space.faceRecognitionEnabled) {
      await this.jobRepository.queue({
        name: JobName.SharedSpaceFaceMatchAll,
        data: { spaceId },
      });
    }

    const notification = await this.notificationRepository.create({
      userId,
      type: NotificationType.Custom,
      level: NotificationLevel.Success,
      title: 'Bulk add complete',
      description: `${count} photos added to space`,
      data: JSON.stringify({ spaceId }),
    });
    this.websocketRepository.clientSend('on_notification', userId, mapNotification(notification));

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpacePersonThumbnail, queue: QueueName.ThumbnailGeneration })
  async handleSharedSpacePersonThumbnail({ id }: JobOf<JobName.SharedSpacePersonThumbnail>): Promise<JobStatus> {
    const person = await this.sharedSpaceRepository.getPersonById(id);
    if (!person || !person.representativeFaceId) {
      return JobStatus.Skipped;
    }

    // Look up the actual face to find the personal person ID for thumbnail generation
    const face = await this.personRepository.getFaceById(person.representativeFaceId);
    if (!face) {
      return JobStatus.Skipped;
    }

    // If the face's personal person has a thumbnail, copy its path
    if (face.personId) {
      const personalPerson = await this.personRepository.getById(face.personId);
      if (personalPerson?.thumbnailPath) {
        await this.sharedSpaceRepository.updatePerson(id, {
          thumbnailPath: personalPerson.thumbnailPath,
        });
        return JobStatus.Success;
      }
    }

    return JobStatus.Skipped;
  }

  private async processSpaceFaceMatch(spaceId: string, assetId: string): Promise<void> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    const maxDistance = machineLearning.facialRecognition.maxDistance;

    const faces = await this.sharedSpaceRepository.getAssetFacesForMatching(assetId);
    for (const face of faces) {
      const isAssigned = await this.sharedSpaceRepository.isPersonFaceAssigned(face.id, spaceId);
      if (isAssigned) {
        continue;
      }

      const matches = await this.sharedSpaceRepository.findClosestSpacePerson(spaceId, face.embedding, {
        maxDistance,
        numResults: 1,
      });

      let personId: string;
      if (matches.length > 0) {
        personId = matches[0].personId;
      } else {
        // Only create a new space person if the face has a linked personal person
        // (faces without one haven't passed the minFaces threshold yet)
        if (!face.personId) {
          continue;
        }

        let name = '';
        const personalPerson = await this.personRepository.getById(face.personId);
        if (personalPerson?.name) {
          name = personalPerson.name;
        }

        const newPerson = await this.sharedSpaceRepository.createPerson({
          spaceId,
          name,
          representativeFaceId: face.id,
          type: 'person',
        });
        personId = newPerson.id;
        await this.jobRepository.queue({
          name: JobName.SharedSpacePersonThumbnail,
          data: { id: newPerson.id },
        });
      }

      await this.sharedSpaceRepository.addPersonFaces([{ personId, assetFaceId: face.id }]);
    }

    // Process pet faces (detected by pet detection, no embeddings)
    const petFaces = await this.sharedSpaceRepository.getPetFacesForAsset(assetId);
    for (const petFace of petFaces) {
      const isAssigned = await this.sharedSpaceRepository.isPersonFaceAssigned(petFace.id, spaceId);
      if (isAssigned) {
        continue;
      }

      if (!petFace.personId) {
        continue;
      }

      // Check if a space person already exists for this personal pet person
      const existingSpacePerson = await this.sharedSpaceRepository.findSpacePersonByLinkedPersonId(
        spaceId,
        petFace.personId,
      );

      let personId: string;
      if (existingSpacePerson) {
        personId = existingSpacePerson.id;
      } else {
        let name = '';
        const personalPerson = await this.personRepository.getById(petFace.personId);
        if (personalPerson?.name) {
          name = personalPerson.name;
        }

        const newPerson = await this.sharedSpaceRepository.createPerson({
          spaceId,
          name,
          representativeFaceId: petFace.id,
          type: 'pet',
        });
        personId = newPerson.id;
        await this.jobRepository.queue({
          name: JobName.SharedSpacePersonThumbnail,
          data: { id: newPerson.id },
        });
      }

      await this.sharedSpaceRepository.addPersonFaces([{ personId, assetFaceId: petFace.id }]);
    }
  }

  private async requireMembership(auth: AuthDto, spaceId: string) {
    const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
    if (!member) {
      throw new ForbiddenException('Not a member of this space');
    }
    return member;
  }

  private async requireRole(auth: AuthDto, spaceId: string, minimumRole: SharedSpaceRole) {
    const member = await this.requireMembership(auth, spaceId);
    if (ROLE_HIERARCHY[member.role as SharedSpaceRole] < ROLE_HIERARCHY[minimumRole]) {
      throw new ForbiddenException('Insufficient role');
    }
    return member;
  }

  private mapMember(member: {
    userId: string;
    name: string;
    email: string;
    role: string;
    joinedAt: unknown;
    profileImagePath: string;
    profileChangedAt: unknown;
    avatarColor: string | null;
    showInTimeline: boolean;
  }): SharedSpaceMemberResponseDto {
    return {
      userId: member.userId,
      name: member.name,
      email: member.email,
      role: member.role,
      joinedAt: (member.joinedAt as Date).toISOString(),
      profileImagePath: member.profileImagePath,
      profileChangedAt: (member.profileChangedAt as Date).toISOString(),
      avatarColor: member.avatarColor ?? undefined,
      showInTimeline: member.showInTimeline,
    };
  }

  private mapSpace(space: {
    id: string;
    name: string;
    description: string | null;
    createdById: string;
    createdAt: unknown;
    updatedAt: unknown;
    thumbnailAssetId?: string | null;
    thumbnailCropY?: number | null;
    color?: string | null;
    faceRecognitionEnabled?: boolean;
    petsEnabled?: boolean;
    lastActivityAt?: Date | null;
  }): SharedSpaceResponseDto {
    return {
      id: space.id,
      name: space.name,
      description: space.description,
      createdById: space.createdById,
      createdAt: (space.createdAt as Date).toISOString(),
      updatedAt: (space.updatedAt as Date).toISOString(),
      thumbnailAssetId: space.thumbnailAssetId ?? null,
      thumbnailCropY: space.thumbnailCropY ?? null,
      color: (space.color as UserAvatarColor) ?? null,
      faceRecognitionEnabled: space.faceRecognitionEnabled ?? true,
      petsEnabled: space.petsEnabled ?? true,
      lastActivityAt: space.lastActivityAt ? space.lastActivityAt.toISOString() : null,
    };
  }

  private mapSpacePerson(
    person: SharedSpacePerson,
    faceCount: number,
    assetCount: number,
    alias: string | null,
  ): SharedSpacePersonResponseDto {
    return {
      id: person.id,
      spaceId: person.spaceId,
      name: person.name,
      thumbnailPath: person.thumbnailPath,
      isHidden: person.isHidden,
      birthDate: person.birthDate,
      representativeFaceId: person.representativeFaceId,
      faceCount,
      assetCount,
      alias,
      createdAt: (person.createdAt as unknown as Date).toISOString(),
      updatedAt: (person.updatedAt as unknown as Date).toISOString(),
      type: person.type,
    };
  }
}
