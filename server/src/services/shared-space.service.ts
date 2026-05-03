import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { setImmediate } from 'node:timers/promises';
import { AssetFace, SharedSpacePerson } from 'src/database';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import type { FilteredMapMarkerDto } from 'src/dtos/gallery-map.dto';
import type { MapMarkerResponseDto } from 'src/dtos/map.dto';
import { mapNotification } from 'src/dtos/notification.dto';
import { PersonFacePageQueryDto, PersonFacePageResponseDto } from 'src/dtos/person.dto';
import {
  SharedSpacePeopleStatisticsResponseDto,
  SharedSpacePersonAliasDto,
  SharedSpacePersonMergeDto,
  SharedSpacePersonResponseDto,
  SharedSpacePersonUpdateDto,
  SpacePeopleQueryDto,
  SpaceRepresentativeFaceUpdateDto,
} from 'src/dtos/shared-space-person.dto';
import {
  SharedSpaceActivityResponseDto,
  SharedSpaceAssetAddDto,
  SharedSpaceAssetRemoveDto,
  SharedSpaceCreateDto,
  SharedSpaceLibraryLinkDto,
  SharedSpaceLinkedLibraryDto,
  SharedSpaceMemberCreateDto,
  SharedSpaceMemberMetadataContributionDto,
  SharedSpaceMemberPreferencesDto,
  SharedSpaceMemberResponseDto,
  SharedSpaceMemberTimelineDto,
  SharedSpaceMemberUpdateDto,
  SharedSpaceResponseDto,
  SharedSpaceUpdateDto,
} from 'src/dtos/shared-space.dto';
import {
  AssetType,
  AssetVisibility,
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
import { asBirthDateString, asDateString } from 'src/utils/date';
import { ImmichMediaResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';

const ROLE_HIERARCHY: Record<SharedSpaceRole, number> = {
  [SharedSpaceRole.Viewer]: 0,
  [SharedSpaceRole.Editor]: 1,
  [SharedSpaceRole.Owner]: 2,
};

const getSharedSpaceRoleScore = (role: string) => ROLE_HIERARCHY[role as SharedSpaceRole] ?? 0;

type SpacePersonMatchResult = {
  id: string;
  identityId?: string | null;
  sourceIdentityId?: string | null;
};

@Injectable()
export class SharedSpaceService extends BaseService {
  private sharedSpaceFaceMatchBatchSize = 1000;

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
              createdAt: (link.createdAt as unknown as Date).toISOString(),
            });
          }
        }
      }

      const recentAssetIds: string[] = [];
      const recentAssetThumbhashes: string[] = [];
      for (const asset of recentAssets) {
        if (asset.thumbhash) {
          recentAssetIds.push(asset.id);
          recentAssetThumbhashes.push(Buffer.from(asset.thumbhash).toString('base64'));
        }
      }

      results.push({
        ...this.mapSpace(space),
        memberCount: members.length,
        assetCount,
        recentAssetIds,
        recentAssetThumbhashes,
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

    let hasPets: boolean | undefined;
    if (space.faceRecognitionEnabled) {
      hasPets = await this.sharedSpaceRepository.hasPetsBySpaceId(id);
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
            createdAt: (link.createdAt as unknown as Date).toISOString(),
          });
        }
      }
    }

    const recentAssetIds: string[] = [];
    const recentAssetThumbhashes: string[] = [];
    for (const asset of recentAssets) {
      if (asset.thumbhash) {
        recentAssetIds.push(asset.id);
        recentAssetThumbhashes.push(Buffer.from(asset.thumbhash).toString('base64'));
      }
    }

    return {
      ...this.mapSpace(space),
      thumbnailAssetId,
      memberCount: members.length,
      assetCount,
      recentAssetIds,
      recentAssetThumbhashes,
      members: members.map((m) => this.mapMember(m)),
      newAssetCount,
      lastViewedAt: membership.lastViewedAt ? (membership.lastViewedAt as unknown as Date).toISOString() : null,
      linkedLibraries,
      hasPets,
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

    // Build update payload with only defined fields — Kysely's .set() with all-undefined
    // values produces an empty SET clause and a SQL syntax error.
    const updatePayload: Parameters<typeof this.sharedSpaceRepository.update>[1] = {};
    if (dto.name !== undefined) {
      updatePayload.name = dto.name;
    }
    if (dto.description !== undefined) {
      updatePayload.description = dto.description;
    }
    if (dto.thumbnailAssetId !== undefined) {
      updatePayload.thumbnailAssetId = dto.thumbnailAssetId;
    }
    if (thumbnailCropY !== undefined) {
      updatePayload.thumbnailCropY = thumbnailCropY;
    }
    if (dto.color !== undefined) {
      updatePayload.color = dto.color;
    }
    if (dto.faceRecognitionEnabled !== undefined) {
      updatePayload.faceRecognitionEnabled = dto.faceRecognitionEnabled;
    }
    if (dto.petsEnabled !== undefined) {
      updatePayload.petsEnabled = dto.petsEnabled;
    }

    const space =
      Object.keys(updatePayload).length > 0 && existing
        ? await this.sharedSpaceRepository.update(id, updatePayload)
        : existing;

    if (!space) {
      throw new BadRequestException('Space not found');
    }

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
    await this.queueSpacePersonMetadataBackfill();
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

    await this.queueSpacePersonMetadataBackfill();

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

    await this.queueSpacePersonMetadataBackfill();

    return this.mapMember(member);
  }

  async updateMemberTimeline(
    auth: AuthDto,
    spaceId: string,
    dto: SharedSpaceMemberTimelineDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    return this.updateMemberPreferences(auth, spaceId, { showInTimeline: dto.showInTimeline });
  }

  async updateMemberPreferences(
    auth: AuthDto,
    spaceId: string,
    dto: SharedSpaceMemberPreferencesDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    await this.requireMembership(auth, spaceId);

    const updates: { showInTimeline?: boolean; sharePersonMetadata?: boolean } = {};
    if (dto.showInTimeline !== undefined) {
      updates.showInTimeline = dto.showInTimeline;
    }
    if (dto.sharePersonMetadata !== undefined) {
      updates.sharePersonMetadata = dto.sharePersonMetadata;
    }

    if (Object.keys(updates).length > 0) {
      await this.sharedSpaceRepository.updateMember(spaceId, auth.user.id, updates);
      await this.queueSpacePersonMetadataBackfill();
    }

    const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
    if (!member) {
      throw new BadRequestException('Member not found');
    }

    return this.mapMember(member);
  }

  async updateMemberMetadataContribution(
    auth: AuthDto,
    spaceId: string,
    userId: string,
    dto: SharedSpaceMemberMetadataContributionDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    if (dto.sharePersonMetadata !== false) {
      throw new BadRequestException('Cannot enable person metadata contribution for another member');
    }

    if (!auth.user.isAdmin) {
      await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);
    }

    const target = await this.sharedSpaceRepository.getMember(spaceId, userId);
    if (!target) {
      throw new BadRequestException('Member not found');
    }

    await this.sharedSpaceRepository.updateMember(spaceId, userId, { sharePersonMetadata: false });
    await this.queueSpacePersonMetadataBackfill();

    const member = await this.sharedSpaceRepository.getMember(spaceId, userId);
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
      await this.queueSpacePersonMetadataBackfill();
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
    await this.queueSpacePersonMetadataBackfill();
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
    await this.sharedSpaceRepository.removePersonFacesByLibrary(spaceId, libraryId);
    await this.sharedSpaceRepository.deleteOrphanedPersons(spaceId);
    await this.queueSpacePersonMetadataBackfill();
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
    await this.queueSpacePersonMetadataBackfill();
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

  async getFilteredMapMarkers(auth: AuthDto, dto: FilteredMapMarkerDto): Promise<MapMarkerResponseDto[]> {
    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    let timelineSpaceIds: string[] | undefined;
    if (!dto.spaceId && dto.withSharedSpaces && dto.isFavorite !== true) {
      const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
      if (spaceRows.length > 0) {
        timelineSpaceIds = spaceRows.map((row) => row.spaceId);
      }
    }

    const scopedPersonFilters = await this.resolveScopedMapPersonFilters(auth, {
      personIds: dto.spaceId ? undefined : dto.personIds,
      spacePersonIds: dto.spaceId ? dto.personIds : undefined,
      withSharedSpaces: dto.withSharedSpaces,
      timelineSpaceIds,
      spaceId: dto.spaceId,
    });

    const markers = await this.sharedSpaceRepository.getFilteredMapMarkers({
      userIds: dto.spaceId ? undefined : [auth.user.id],
      spaceId: dto.spaceId,
      timelineSpaceIds,
      personIds: scopedPersonFilters.personIds,
      spacePersonIds: scopedPersonFilters.spacePersonIds,
      identityIds: scopedPersonFilters.identityIds,
      forceEmptyResult: scopedPersonFilters.forceEmptyResult,
      tagIds: dto.tagIds,
      make: dto.make,
      model: dto.model,
      rating: dto.rating,
      type: dto.type === 'IMAGE' ? AssetType.Image : dto.type === 'VIDEO' ? AssetType.Video : undefined,
      takenAfter: dto.takenAfter,
      takenBefore: dto.takenBefore,
      isFavorite: dto.isFavorite,
      city: dto.city,
      country: dto.country,
      visibility: AssetVisibility.Timeline,
      personMatchAny: true,
      tagMatchAny: true,
    });

    return markers.map((marker) => ({
      id: marker.id,
      lat: marker.lat,
      lon: marker.lon,
      city: marker.city ?? null,
      state: marker.state ?? null,
      country: marker.country ?? null,
    }));
  }

  private async resolveScopedMapPersonFilters(
    auth: AuthDto,
    filters: {
      personIds?: string[];
      spacePersonIds?: string[];
      identityIds?: string[];
      forceEmptyResult?: boolean;
      withSharedSpaces?: boolean;
      timelineSpaceIds?: string[];
      spaceId?: string;
    },
  ) {
    const tokens = filters.personIds?.filter(Boolean) ?? [];
    const hasScopedTokens = tokens.some((token) => token.includes(':'));

    if (tokens.length === 0 || !hasScopedTokens) {
      return filters;
    }

    const resolution = await this.faceIdentityRepository.resolveScopedPersonTokens({
      userId: auth.user.id,
      tokens,
      scope: {
        withSharedSpaces: filters.withSharedSpaces,
        timelineSpaceIds: filters.timelineSpaceIds,
        spaceId: filters.spaceId,
      },
    });

    return {
      ...filters,
      personIds: resolution.legacyPersonIds,
      identityIds: resolution.identityIds,
      spacePersonIds: [...new Set([...(filters.spacePersonIds ?? []), ...resolution.legacySpacePersonIds])],
      forceEmptyResult: filters.forceEmptyResult || resolution.hasInaccessibleToken,
    };
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

    const persons = await this.sharedSpaceRepository.getPersonsBySpaceId(spaceId, {
      withHidden: query?.withHidden ?? false,
      petsEnabled: space.petsEnabled,
      limit: query?.limit,
      offset: query?.offset,
      named: query?.named,
      name: query?.name,
      takenAfter: query?.takenAfter,
      takenBefore: query?.takenBefore,
    });

    const aliases =
      persons.length > 0 ? await this.sharedSpaceRepository.getAliasesBySpaceAndUser(spaceId, auth.user.id) : [];
    const aliasMap = new Map(aliases.map((a) => [a.personId, a.alias]));

    return persons.map((person) => this.mapSpacePerson(person, aliasMap.get(person.id) ?? null));
  }

  async getSpacePeopleStatistics(
    auth: AuthDto,
    spaceId: string,
    query?: SpacePeopleQueryDto,
  ): Promise<SharedSpacePeopleStatisticsResponseDto> {
    await this.requireMembership(auth, spaceId);

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space?.faceRecognitionEnabled) {
      return { total: 0, hidden: 0 };
    }

    return this.sharedSpaceRepository.countPersonsBySpaceId(spaceId, {
      petsEnabled: space.petsEnabled,
      named: query?.named,
      name: query?.name,
      takenAfter: query?.takenAfter,
      takenBefore: query?.takenBefore,
    });
  }

  async getSpacePersonFaces(
    auth: AuthDto,
    spaceId: string,
    personId: string,
    dto: PersonFacePageQueryDto,
  ): Promise<PersonFacePageResponseDto> {
    await this.requireMembership(auth, spaceId);
    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    const take = dto.size;
    const skip = (dto.page - 1) * dto.size;
    const rows = await this.sharedSpaceRepository.getSpaceRepresentativeFaces({ spaceId, personId, take, skip });
    const page = rows.slice(0, take);

    return {
      faces: page.map((face) => ({
        id: face.id,
        assetId: face.assetId,
        imageHeight: face.imageHeight,
        imageWidth: face.imageWidth,
        boundingBoxX1: face.boundingBoxX1,
        boundingBoxX2: face.boundingBoxX2,
        boundingBoxY1: face.boundingBoxY1,
        boundingBoxY2: face.boundingBoxY2,
        sourceType: face.sourceType,
        fileCreatedAt: asDateString(face.fileCreatedAt) ?? undefined,
        isRepresentative: face.id === person.representativeFaceId,
      })),
      hasNextPage: rows.length > take,
    };
  }

  async updateSpacePersonRepresentativeFace(
    auth: AuthDto,
    spaceId: string,
    personId: string,
    dto: SpaceRepresentativeFaceUpdateDto,
  ): Promise<SharedSpacePersonResponseDto> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    if (dto.assetFaceId === null) {
      const representativeFaceId =
        person.representativeFaceId &&
        (await this.sharedSpaceRepository.isSpacePersonRepresentativeFaceValid(person.id, person.representativeFaceId))
          ? person.representativeFaceId
          : await this.sharedSpaceRepository.getFirstValidRepresentativeFaceForPerson(person.id);
      const updated = await this.sharedSpaceRepository.updatePerson(person.id, {
        representativeFaceSource: 'auto',
        representativeFaceId,
      });
      const alias = await this.sharedSpaceRepository.getAlias(person.id, auth.user.id);
      return this.mapSpacePerson(updated, alias?.alias ?? null);
    }

    const face = await this.sharedSpaceRepository.getSpaceRepresentativeFaceForUpdate({
      spaceId,
      personId,
      assetFaceId: dto.assetFaceId,
    });
    if (!face) {
      throw new BadRequestException('Representative face must belong to the space person');
    }

    const updated = await this.sharedSpaceRepository.updatePerson(person.id, {
      representativeFaceId: face.id,
      representativeFaceSource: 'manual',
    });
    if (person.identityId) {
      await this.faceIdentityRepository.updateRepresentativeFace({
        identityId: person.identityId,
        assetFaceId: face.id,
      });
    }
    const alias = await this.sharedSpaceRepository.getAlias(person.id, auth.user.id);
    return this.mapSpacePerson(updated, alias?.alias ?? null);
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

    const alias = await this.sharedSpaceRepository.getAlias(personId, auth.user.id);

    return this.mapSpacePerson(person, alias?.alias ?? null);
  }

  async getSpacePersonThumbnail(auth: AuthDto, spaceId: string, personId: string): Promise<ImmichMediaResponse> {
    await this.requireMembership(auth, spaceId);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new NotFoundException();
    }

    if (person.representativeFaceSource === 'manual') {
      if (!person.representativeFaceId) {
        throw new NotFoundException();
      }

      const face = await this.sharedSpaceRepository.getSpaceRepresentativeFaceForUpdate({
        spaceId,
        personId: person.id,
        assetFaceId: person.representativeFaceId,
      });
      if (!face) {
        throw new NotFoundException();
      }

      const sourcePath = await this.getFaceThumbnailSource(face.assetId);
      if (!sourcePath) {
        throw new NotFoundException();
      }

      return this.generateFaceThumbnailResponse(face, sourcePath);
    }

    if (person.identityId) {
      const personalThumbnail = await this.sharedSpaceRepository.getPersonalThumbnailForSpacePerson({
        userId: auth.user.id,
        spaceId,
        identityId: person.identityId,
      });

      if (personalThumbnail) {
        return this.serveFromBackend(
          personalThumbnail.thumbnailPath,
          mimeTypes.lookup(personalThumbnail.thumbnailPath),
          CacheControl.PrivateWithoutCache,
        );
      }
    }

    if (!person.representativeFaceId) {
      throw new NotFoundException();
    }

    const isInSpace = await this.sharedSpaceRepository.isFaceInSpace(spaceId, person.representativeFaceId);
    if (!isInSpace) {
      throw new NotFoundException();
    }

    let face: AssetFace;
    try {
      face = await this.personRepository.getFaceById(person.representativeFaceId);
    } catch {
      throw new NotFoundException();
    }
    if (!face) {
      throw new NotFoundException();
    }

    const sourcePath = await this.getFaceThumbnailSource(face.assetId);
    if (!sourcePath) {
      throw new NotFoundException();
    }

    return this.generateFaceThumbnailResponse(face, sourcePath);
  }

  async getSpacePersonFaceThumbnail(
    auth: AuthDto,
    spaceId: string,
    personId: string,
    faceId: string,
  ): Promise<ImmichMediaResponse> {
    await this.requireMembership(auth, spaceId);
    const face = await this.sharedSpaceRepository.getSpaceRepresentativeFaceForUpdate({
      spaceId,
      personId,
      assetFaceId: faceId,
    });
    if (!face) {
      throw new NotFoundException();
    }

    const sourcePath = await this.getFaceThumbnailSource(face.assetId);
    if (!sourcePath) {
      throw new NotFoundException();
    }

    return this.generateFaceThumbnailResponse(face, sourcePath);
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

    const sharedPersonUpdates: Parameters<typeof this.sharedSpaceRepository.updatePerson>[1] = {
      isHidden: dto.isHidden,
      representativeFaceId: dto.representativeFaceId,
    };
    if (dto.name !== undefined) {
      sharedPersonUpdates.name = dto.name;
      sharedPersonUpdates.nameSource = 'manual';
      sharedPersonUpdates.nameSourceProfileType = 'space-person';
      sharedPersonUpdates.nameSourceProfileId = personId;
      sharedPersonUpdates.nameSourceUpdatedAt = new Date();
    }

    const hasSharedPersonUpdates = Object.values(sharedPersonUpdates).some((value) => value !== undefined);
    if (hasSharedPersonUpdates) {
      await this.sharedSpaceRepository.updatePerson(personId, sharedPersonUpdates);
    }

    if (dto.birthDate !== undefined) {
      await this.sharedSpaceRepository.updatePerson(personId, {
        birthDate: dto.birthDate,
        birthDateSource: 'manual',
        birthDateSourceProfileType: 'space-person',
        birthDateSourceProfileId: personId,
        birthDateSourceUpdatedAt: new Date(),
      });
    }

    if (person.identityId && (dto.name !== undefined || dto.birthDate !== undefined || dto.isHidden !== undefined)) {
      await this.queueSpacePersonMetadataBackfill(person.identityId);
    }

    const alias = await this.sharedSpaceRepository.getAlias(personId, auth.user.id);

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonUpdate,
      data: { personId },
    });

    const enriched = await this.sharedSpaceRepository.getPersonById(personId);
    if (!enriched) {
      throw new BadRequestException('Person not found');
    }

    return this.mapSpacePerson(enriched, alias?.alias ?? null);
  }

  async deleteSpacePerson(auth: AuthDto, spaceId: string, personId: string): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const person = await this.sharedSpaceRepository.getPersonById(personId);
    if (!person || person.spaceId !== spaceId) {
      throw new BadRequestException('Person not found');
    }

    await this.sharedSpaceRepository.deletePerson(personId);
    if (person.identityId) {
      await this.queueSpacePersonMetadataBackfill(person.identityId);
    }

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonDelete,
      data: { personId, personName: person.name || '' },
    });
  }

  async deduplicateSpacePeople(auth: AuthDto, spaceId: string): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);

    await this.jobRepository.queue({
      name: JobName.SharedSpacePersonDedup,
      data: { spaceId },
    });
  }

  async backfillSpacePersonMetadata(input: {
    cursor?: string;
    identityId?: string;
    limit: number;
  }): Promise<{ processed: number; inherited: number; skipped: number; nextCursor?: string }> {
    const limit = Math.max(1, input.limit);
    const people = await this.sharedSpaceRepository.getSpacePersonMetadataBackfillPage({
      cursor: input.cursor,
      identityId: input.identityId,
      limit,
    });

    let inherited = 0;
    let skipped = 0;
    for (const person of people) {
      if (!person.identityId) {
        skipped++;
        continue;
      }
      const assetAdderIds = await this.sharedSpaceRepository.getSpacePersonAssetAdderIds(person.spaceId, person.id);
      const didInherit = await this.inheritSpacePersonMetadata(
        person.spaceId,
        person.id,
        person.identityId,
        assetAdderIds,
      );
      if (didInherit) {
        inherited++;
      } else {
        skipped++;
      }
    }

    return {
      processed: people.length,
      inherited,
      skipped,
      ...(people.length === limit ? { nextCursor: people.at(-1)?.id } : {}),
    };
  }

  private async queueSpacePersonMetadataBackfill(identityId?: string | null): Promise<void> {
    await this.jobRepository.queue({
      name: JobName.SharedSpacePersonMetadataBackfill,
      data: identityId ? { identityId } : {},
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

    const candidateIdentityIds = [target.identityId, ...sources.map((source) => source.identityId)].filter(
      (identityId): identityId is string => !!identityId,
    );
    if (candidateIdentityIds.length > 0) {
      const mergedIdentityId = await this.mergeIdentitiesForSpacePersonEvidence({
        spaceId,
        targetSpacePersonId: targetPersonId,
        candidateIdentityIds,
      });
      await this.inheritSpacePersonMetadata(spaceId, targetPersonId, mergedIdentityId);
      await this.queueSpacePersonMetadataBackfill(mergedIdentityId);
    }

    await this.sharedSpaceRepository.recountPersons([targetPersonId]);

    // Queue dedup pass — merged person's embedding profile may now match other persons
    await this.jobRepository.queue({
      name: JobName.SharedSpacePersonDedup,
      data: { spaceId },
    });

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

    // Queue dedup pass (jobId deduplication prevents queue spam)
    await this.jobRepository.queue({
      name: JobName.SharedSpacePersonDedup,
      data: { spaceId },
    });

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
      // Re-check link each batch to handle concurrent unlink
      const stillLinked = await this.sharedSpaceRepository.hasLibraryLink(job.spaceId, job.libraryId);
      if (!stillLinked) {
        this.logger.log(`Library ${job.libraryId} was unlinked from space ${job.spaceId} during sync, stopping`);
        break;
      }

      const assets = await this.assetRepository.getByLibraryIdWithFaces(job.libraryId, batchSize, offset);
      if (assets.length === 0) {
        break;
      }

      for (const asset of assets) {
        await this.processSpaceFaceMatch(job.spaceId, asset.id);
      }

      offset += assets.length;
    }

    // Queue dedup pass after library sync completes
    await this.jobRepository.queue({
      name: JobName.SharedSpacePersonDedup,
      data: { spaceId: job.spaceId },
    });

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpaceFaceMatchAll, queue: QueueName.FacialRecognition })
  async handleSharedSpaceFaceMatchAll({ spaceId }: JobOf<JobName.SharedSpaceFaceMatchAll>): Promise<JobStatus> {
    const batchSize = this.sharedSpaceFaceMatchBatchSize;
    let processedAny = false;
    let afterAssetId: string | undefined;

    const initialSpace = await this.sharedSpaceRepository.getById(spaceId);
    if (!initialSpace || !initialSpace.faceRecognitionEnabled) {
      return JobStatus.Skipped;
    }

    while (true) {
      const currentSpace = await this.sharedSpaceRepository.getById(spaceId);
      if (!currentSpace || !currentSpace.faceRecognitionEnabled) {
        return JobStatus.Success;
      }

      const assets = await this.sharedSpaceRepository.getAssetIdsInSpacePage(spaceId, {
        limit: batchSize,
        ...(afterAssetId ? { afterAssetId } : {}),
      });

      if (assets.length === 0) {
        break;
      }

      for (const { assetId } of assets) {
        await this.processSpaceFaceMatch(spaceId, assetId);
        processedAny = true;
      }

      afterAssetId = assets.at(-1)?.assetId;
      if (assets.length < batchSize) {
        break;
      }

      await setImmediate();
    }

    if (processedAny) {
      const finalSpace = await this.sharedSpaceRepository.getById(spaceId);
      if (!finalSpace || !finalSpace.faceRecognitionEnabled) {
        return JobStatus.Success;
      }

      await this.jobRepository.queue({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpacePersonDedup, queue: QueueName.FacialRecognition })
  async handleSharedSpacePersonDedup(job: JobOf<JobName.SharedSpacePersonDedup>): Promise<JobStatus> {
    const space = await this.sharedSpaceRepository.getById(job.spaceId);
    if (!space || !space.faceRecognitionEnabled) {
      this.logger.debug(`Dedup skipped for space ${job.spaceId}: ${space ? 'face recognition disabled' : 'not found'}`);
      return JobStatus.Skipped;
    }

    const { machineLearning } = await this.getConfig({ withCache: true });
    const maxDistance = machineLearning.facialRecognition.maxDistance;

    // Repair persons that have faces but lost their representativeFaceId
    // (e.g., after force-detection reset). Without this, they are invisible
    // to getSpacePersonsWithEmbeddings due to the INNER JOIN on face_search.
    await this.sharedSpaceRepository.repairInvalidRepresentativeFaces(job.spaceId);
    await this.sharedSpaceRepository.repairOrphanedRepresentativeFaces(job.spaceId);

    const MAX_PASSES = 100;
    let totalMerges = 0;
    let pass = 0;
    let mergedAny = true;
    const affectedIdentityIds = new Set<string>();

    while (mergedAny) {
      mergedAny = false;
      pass++;

      if (pass > MAX_PASSES) {
        this.logger.error(
          `Dedup for space ${job.spaceId} exceeded ${MAX_PASSES} passes — aborting to prevent infinite loop`,
        );
        break;
      }

      const persons = await this.sharedSpaceRepository.getSpacePersonsWithEmbeddings(job.spaceId);
      this.logger.log(`Dedup pass ${pass} for space ${job.spaceId}: ${persons.length} persons to check`);

      if (persons.length <= 1) {
        break;
      }

      const deletedIds = new Set<string>();
      const targetIds = new Set<string>();
      let passMerges = 0;

      for (const person of persons) {
        if (deletedIds.has(person.id)) {
          continue;
        }

        if (person.identityId) {
          continue;
        }

        const matches = await this.sharedSpaceRepository.findClosestSpacePerson(job.spaceId, person.embedding, {
          maxDistance,
          numResults: 1,
          excludePersonIds: [person.id, ...deletedIds],
          type: person.type,
        });

        if (matches.length === 0) {
          continue;
        }

        const match = matches[0];
        const matchPerson = persons.find((p) => p.id === match.personId);
        if (!matchPerson || deletedIds.has(match.personId)) {
          this.logger.debug(
            `Dedup: skipping stale match ${match.personId} for person ${person.id} (already merged in this pass)`,
          );
          continue;
        }

        if (matchPerson.identityId) {
          continue;
        }

        // Determine target (more faces) and source
        const [target, source] =
          person.faceCount >= matchPerson.faceCount ? [person, matchPerson] : [matchPerson, person];

        this.logger.log(
          `Dedup: merging person ${source.id} (${source.name || 'unnamed'}, ${source.faceCount} faces) into ${target.id} (${target.name || 'unnamed'}, ${target.faceCount} faces), distance=${match.distance.toFixed(4)}`,
        );

        // Reassign faces and migrate aliases
        await this.sharedSpaceRepository.reassignPersonFacesSafe(source.id, target.id);
        await this.sharedSpaceRepository.migrateAliases(source.id, target.id);

        const candidateIdentityIds = [target.identityId, source.identityId].filter(
          (identityId): identityId is string => !!identityId,
        );
        if (candidateIdentityIds.length > 0) {
          const mergedIdentityId = await this.mergeIdentitiesForSpacePersonEvidence({
            spaceId: job.spaceId,
            targetSpacePersonId: target.id,
            candidateIdentityIds,
          });
          await this.inheritSpacePersonMetadata(job.spaceId, target.id, mergedIdentityId);
          affectedIdentityIds.add(mergedIdentityId);
        }

        // Refresh representativeFaceId to a face with a valid embedding from the merged pool
        if (target.representativeFaceSource !== 'manual') {
          const newRepFace = await this.sharedSpaceRepository.getFirstFaceIdForPerson(target.id);
          if (newRepFace && newRepFace !== target.representativeFaceId) {
            try {
              await this.sharedSpaceRepository.updatePerson(target.id, { representativeFaceId: newRepFace });
            } catch (error) {
              this.logger.warn(`Dedup: failed to update representativeFaceId for target ${target.id}: ${error}`);
            }
          }
        }

        // Determine merged properties
        const updates: Partial<{ name: string; isHidden: boolean }> = {};
        if (!target.name && source.name) {
          updates.name = source.name;
        }
        if (target.isHidden && !source.isHidden) {
          updates.isHidden = false;
        }

        // Update and delete separately so deletePerson still runs if updatePerson fails
        try {
          if (Object.keys(updates).length > 0) {
            await this.sharedSpaceRepository.updatePerson(target.id, updates);
          }
        } catch (error) {
          // Target may have been concurrently deleted — faces were already reassigned, continue to delete source
          this.logger.warn(`Dedup: updatePerson failed for target ${target.id}: ${error}`);
        }

        try {
          await this.sharedSpaceRepository.deletePerson(source.id);
        } catch (error) {
          // Source may have been concurrently deleted — safe to ignore
          this.logger.warn(`Dedup: deletePerson failed for source ${source.id}: ${error}`);
        }

        deletedIds.add(source.id);
        targetIds.add(target.id);
        passMerges++;
        mergedAny = true;
      }

      if (targetIds.size > 0) {
        await this.sharedSpaceRepository.recountPersons([...targetIds]);
      }

      totalMerges += passMerges;
      this.logger.log(`Dedup pass ${pass} complete: ${passMerges} merges`);
    }

    // Clean up orphaned persons (no faces linked) as safety net
    await this.sharedSpaceRepository.deleteOrphanedPersons(job.spaceId);

    for (const identityId of affectedIdentityIds) {
      await this.queueSpacePersonMetadataBackfill(identityId);
    }

    this.logger.log(
      `Dedup finished for space ${job.spaceId}: ${totalMerges} total merges across ${pass} pass${pass === 1 ? '' : 'es'}`,
    );
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SharedSpacePersonMetadataBackfill, queue: QueueName.PeopleBackfill })
  async handleSharedSpacePersonMetadataBackfill({
    cursor,
    identityId,
    limit = 1000,
  }: JobOf<JobName.SharedSpacePersonMetadataBackfill>): Promise<JobStatus> {
    const result = await this.backfillSpacePersonMetadata({ cursor, identityId, limit });
    if (result.nextCursor) {
      await this.jobRepository.queue({
        name: JobName.SharedSpacePersonMetadataBackfill,
        data: { cursor: result.nextCursor, identityId, limit },
      });
    }
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

  private async processSpaceFaceMatch(spaceId: string, assetId: string): Promise<void> {
    const isAssetInSpace = await this.sharedSpaceRepository.isAssetInSpace(spaceId, assetId);
    if (!isAssetInSpace) {
      return;
    }

    const spaceAsset = await this.sharedSpaceRepository.getSpaceAssetAdder(spaceId, assetId);
    const assetAdderId = spaceAsset?.addedById ?? null;
    const { machineLearning } = await this.getConfig({ withCache: true });
    const maxDistance = machineLearning.facialRecognition.maxDistance;
    const affectedPersonIds = new Set<string>();

    const faces = await this.sharedSpaceRepository.getAssetFacesForMatching(assetId);
    for (const face of faces) {
      const isAssigned = await this.sharedSpaceRepository.isPersonFaceAssigned(face.id, spaceId);
      if (isAssigned) {
        continue;
      }

      // Strict gate: only faces native recognition has already assigned to a global
      // person are eligible to join a space-person. This guarantees every face in a
      // space-person belongs to a density-validated native cluster and eliminates the
      // single-face chaining bug reported in #272.
      if (!face.personId) {
        continue;
      }

      if (face.identityId === null) {
        continue;
      }

      const spacePerson = face.identityId
        ? await this.findOrCreateSpacePersonForFace({
            spaceId,
            faceId: face.id,
            personId: face.personId,
            identityId: face.identityId,
            type: face.type ?? 'person',
          })
        : await this.findOrCreateSpacePersonForLegacyFace({
            spaceId,
            faceId: face.id,
            personId: face.personId,
            embedding: face.embedding,
            maxDistance,
          });

      await this.sharedSpaceRepository.addPersonFaces([{ personId: spacePerson.id, assetFaceId: face.id }], {
        skipRecount: true,
      });
      let inheritedIdentityId = spacePerson.identityId ?? null;
      if (
        spacePerson.identityId &&
        spacePerson.sourceIdentityId &&
        spacePerson.identityId !== spacePerson.sourceIdentityId
      ) {
        inheritedIdentityId = await this.mergeIdentitiesForSpacePersonEvidence({
          spaceId,
          targetSpacePersonId: spacePerson.id,
          candidateIdentityIds: [spacePerson.identityId, spacePerson.sourceIdentityId],
        });
        await this.queueSpacePersonMetadataBackfill(inheritedIdentityId);
      }
      if (inheritedIdentityId) {
        await this.inheritSpacePersonMetadata(spaceId, spacePerson.id, inheritedIdentityId, assetAdderId);
      }
      affectedPersonIds.add(spacePerson.id);
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

      let spacePerson = petFace.identityId
        ? await this.sharedSpaceRepository.getSpacePersonByIdentity(spaceId, petFace.identityId)
        : undefined;
      if (!spacePerson && petFace.identityId) {
        const representativeFaceId = await this.getNewSpacePersonRepresentativeFaceId({
          spaceId,
          fallbackFaceId: petFace.id,
          personalPersonId: petFace.personId,
        });
        spacePerson = await this.sharedSpaceRepository.createPerson({
          spaceId,
          identityId: petFace.identityId,
          name: '',
          representativeFaceId,
          type: 'pet',
        });
      } else if (!spacePerson) {
        const existingSpacePerson = await this.sharedSpaceRepository.findSpacePersonByLinkedPersonId(
          spaceId,
          petFace.personId,
        );
        const representativeFaceId = existingSpacePerson
          ? petFace.id
          : await this.getNewSpacePersonRepresentativeFaceId({
              spaceId,
              fallbackFaceId: petFace.id,
              personalPersonId: petFace.personId,
            });
        spacePerson =
          existingSpacePerson ??
          (await this.sharedSpaceRepository.createPerson({
            spaceId,
            name: '',
            representativeFaceId,
            type: 'pet',
          }));
      }

      await this.sharedSpaceRepository.addPersonFaces([{ personId: spacePerson.id, assetFaceId: petFace.id }], {
        skipRecount: true,
      });
      if (spacePerson.identityId) {
        await this.inheritSpacePersonMetadata(spaceId, spacePerson.id, spacePerson.identityId, assetAdderId);
      }
      affectedPersonIds.add(spacePerson.id);
    }

    if (affectedPersonIds.size > 0) {
      await this.sharedSpaceRepository.recountPersons([...affectedPersonIds]);
    }
  }

  private async findOrCreateSpacePersonForFace(input: {
    spaceId: string;
    faceId: string;
    personId: string;
    identityId: string;
    type: string;
  }): Promise<SpacePersonMatchResult> {
    const existingByIdentity = await this.sharedSpaceRepository.getSpacePersonByIdentity(
      input.spaceId,
      input.identityId,
    );
    if (existingByIdentity) {
      return existingByIdentity;
    }

    const representativeFaceId = await this.getNewSpacePersonRepresentativeFaceId({
      spaceId: input.spaceId,
      fallbackFaceId: input.faceId,
      personalPersonId: input.personId,
    });

    return this.sharedSpaceRepository.createPerson({
      spaceId: input.spaceId,
      identityId: input.identityId,
      name: '',
      representativeFaceId,
      type: input.type,
    });
  }

  private async findOrCreateSpacePersonForLegacyFace(input: {
    spaceId: string;
    faceId: string;
    personId: string;
    embedding: string;
    maxDistance: number;
  }): Promise<SpacePersonMatchResult> {
    const existingSpacePerson = await this.sharedSpaceRepository.findSpacePersonByLinkedPersonId(
      input.spaceId,
      input.personId,
    );

    if (existingSpacePerson) {
      return existingSpacePerson;
    }

    const matches = await this.sharedSpaceRepository.findClosestSpacePerson(input.spaceId, input.embedding, {
      maxDistance: input.maxDistance,
      numResults: 1,
    });

    if (matches.length > 0) {
      return { id: matches[0].personId, identityId: matches[0].identityId ?? null };
    }

    const representativeFaceId = await this.getNewSpacePersonRepresentativeFaceId({
      spaceId: input.spaceId,
      fallbackFaceId: input.faceId,
      personalPersonId: input.personId,
    });

    return this.sharedSpaceRepository.createPerson({
      spaceId: input.spaceId,
      name: '',
      representativeFaceId,
      type: 'person',
    });
  }

  private async getNewSpacePersonRepresentativeFaceId(input: {
    spaceId: string;
    fallbackFaceId: string;
    personalPersonId: string | null;
  }): Promise<string> {
    if (!input.personalPersonId) {
      return input.fallbackFaceId;
    }

    const person = await this.personRepository.getById(input.personalPersonId);
    if (!person?.thumbnailPath || !person.faceAssetId) {
      return input.fallbackFaceId;
    }

    if (person.faceAssetId === input.fallbackFaceId) {
      return input.fallbackFaceId;
    }

    const isFeatureFaceInSpace = await this.sharedSpaceRepository.isFaceInSpace(input.spaceId, person.faceAssetId);
    return isFeatureFaceInSpace ? person.faceAssetId : input.fallbackFaceId;
  }

  private async mergeIdentitiesForSpacePersonEvidence(input: {
    spaceId: string;
    targetSpacePersonId: string;
    candidateIdentityIds: string[];
  }): Promise<string> {
    const targetSpacePerson = await this.sharedSpaceRepository.getPersonById(input.targetSpacePersonId);
    const candidates = [...new Set(input.candidateIdentityIds.filter(Boolean))];
    const evidence = await this.sharedSpaceRepository.getIdentityEvidenceForSpacePerson(
      input.spaceId,
      input.targetSpacePersonId,
      candidates,
    );

    if (!targetSpacePerson || targetSpacePerson.spaceId !== input.spaceId || evidence.length === 0) {
      return candidates[0];
    }

    const types = new Set(evidence.map((item) => item.type));
    if (types.size > 1) {
      this.logger.warn(`Skipping identity merge for space person ${input.targetSpacePersonId}: incompatible types`);
      return (
        targetSpacePerson.identityId ??
        evidence.toSorted((a, b) => a.identityId.localeCompare(b.identityId))[0].identityId
      );
    }

    const targetIdentityId =
      targetSpacePerson.identityId && evidence.some((item) => item.identityId === targetSpacePerson.identityId)
        ? targetSpacePerson.identityId
        : evidence.toSorted((a, b) => {
            const supportDelta = Number(b.supportingFaceCount) - Number(a.supportingFaceCount);
            return supportDelta === 0 ? a.identityId.localeCompare(b.identityId) : supportDelta;
          })[0].identityId;

    const sourceIdentityIds = evidence
      .map((item) => item.identityId)
      .filter((identityId) => identityId !== targetIdentityId)
      .toSorted();

    if (sourceIdentityIds.length > 0) {
      await this.faceIdentityRepository.mergeIdentities({
        targetIdentityId,
        sourceIdentityIds,
        source: 'shared-space-evidence',
      });
    }

    if (targetSpacePerson.identityId !== targetIdentityId) {
      await this.sharedSpaceRepository.updatePerson(input.targetSpacePersonId, { identityId: targetIdentityId });
    }

    return targetIdentityId;
  }

  private async inheritSpacePersonMetadata(
    spaceId: string,
    spacePersonId: string,
    identityId: string,
    assetAdderIdOrIds?: string | string[] | null,
  ): Promise<boolean> {
    const person = await this.sharedSpaceRepository.getPersonById(spacePersonId);
    if (!person || person.spaceId !== spaceId) {
      return false;
    }
    const assetAdderIds = Array.isArray(assetAdderIdOrIds)
      ? assetAdderIdOrIds
      : assetAdderIdOrIds
        ? [assetAdderIdOrIds]
        : [];

    const metadataCandidates = await this.sharedSpaceRepository.getMetadataInheritanceCandidates({
      spaceId,
      identityId,
      assetAdderIds,
    });
    const candidates = metadataCandidates.filter((item) => item.type === person.type);
    const updates: Parameters<typeof this.sharedSpaceRepository.updatePerson>[1] = {};
    const now = new Date();
    const nameCandidate = this.selectMetadataCandidate(
      candidates.filter((candidate) => candidate.name.trim().length > 0),
      (candidate) => candidate.name.trim(),
    );
    const birthDateCandidate = this.selectMetadataCandidate(
      candidates.filter((candidate) => candidate.birthDate !== null),
      (candidate) => asBirthDateString(candidate.birthDate) ?? '',
    );

    if ((person.nameSource === 'none' || person.nameSource === 'inherited') && nameCandidate) {
      updates.name = nameCandidate.value;
      updates.nameSource = 'inherited';
      updates.nameSourceProfileType = nameCandidate.candidate.sourceProfileType ?? 'user-person';
      updates.nameSourceProfileId = nameCandidate.candidate.sourceProfileId ?? nameCandidate.candidate.personId;
      updates.nameSourceUpdatedAt = now;
    } else if (person.nameSource === 'inherited' && !nameCandidate) {
      updates.name = '';
      updates.nameSource = 'none';
      updates.nameSourceProfileType = null;
      updates.nameSourceProfileId = null;
      updates.nameSourceUpdatedAt = null;
    }

    if ((person.birthDateSource === 'none' || person.birthDateSource === 'inherited') && birthDateCandidate) {
      updates.birthDate = birthDateCandidate.value;
      updates.birthDateSource = 'inherited';
      updates.birthDateSourceProfileType = birthDateCandidate.candidate.sourceProfileType ?? 'user-person';
      updates.birthDateSourceProfileId =
        birthDateCandidate.candidate.sourceProfileId ?? birthDateCandidate.candidate.personId;
      updates.birthDateSourceUpdatedAt = now;
    } else if (person.birthDateSource === 'inherited' && !birthDateCandidate) {
      updates.birthDate = null;
      updates.birthDateSource = 'none';
      updates.birthDateSourceProfileType = null;
      updates.birthDateSourceProfileId = null;
      updates.birthDateSourceUpdatedAt = null;
    }

    if (Object.keys(updates).length > 0) {
      await this.sharedSpaceRepository.updatePerson(spacePersonId, updates);
      return true;
    }
    return false;
  }

  private selectMetadataCandidate<T extends { role: string; isAssetAdder: boolean; supportingFaceCount: number }>(
    candidates: T[],
    getValue: (candidate: T) => string,
  ): { candidate: T; value: string } | null {
    if (candidates.length === 0) {
      return null;
    }

    const ranked = candidates
      .map((candidate) => ({ candidate, value: getValue(candidate) }))
      .toSorted((a, b) => {
        const roleDelta = getSharedSpaceRoleScore(b.candidate.role) - getSharedSpaceRoleScore(a.candidate.role);
        if (roleDelta !== 0) {
          return roleDelta;
        }
        const assetAdderDelta = Number(b.candidate.isAssetAdder) - Number(a.candidate.isAssetAdder);
        if (assetAdderDelta !== 0) {
          return assetAdderDelta;
        }
        const faceDelta = Number(b.candidate.supportingFaceCount) - Number(a.candidate.supportingFaceCount);
        if (faceDelta !== 0) {
          return faceDelta;
        }
        return 0;
      });

    const best = ranked[0].candidate;
    const topCandidates = ranked.filter(
      (item) =>
        getSharedSpaceRoleScore(item.candidate.role) === getSharedSpaceRoleScore(best.role) &&
        item.candidate.isAssetAdder === best.isAssetAdder &&
        Number(item.candidate.supportingFaceCount) === Number(best.supportingFaceCount),
    );
    const values = new Set(topCandidates.map((item) => item.value));
    return values.size === 1 ? ranked[0] : null;
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
    sharePersonMetadata: boolean;
  }): SharedSpaceMemberResponseDto {
    return {
      userId: member.userId,
      name: member.name,
      email: member.email,
      role: member.role as SharedSpaceRole,
      joinedAt: (member.joinedAt as Date).toISOString(),
      profileImagePath: member.profileImagePath,
      profileChangedAt: (member.profileChangedAt as Date).toISOString(),
      avatarColor: member.avatarColor ?? undefined,
      showInTimeline: member.showInTimeline,
      sharePersonMetadata: member.sharePersonMetadata,
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

  private mapSpacePerson(person: SharedSpacePerson, alias: string | null): SharedSpacePersonResponseDto {
    return {
      id: person.id,
      spaceId: person.spaceId,
      name: person.name || '',
      thumbnailPath: '',
      isHidden: person.isHidden,
      birthDate: asBirthDateString(person.birthDate),
      representativeFaceId: person.representativeFaceId,
      representativeFaceSource: person.representativeFaceSource ?? 'auto',
      faceCount: person.faceCount,
      assetCount: person.assetCount,
      alias,
      createdAt: (person.createdAt as unknown as Date).toISOString(),
      updatedAt: (person.updatedAt as unknown as Date).toISOString(),
      type: person.type,
    };
  }
}
