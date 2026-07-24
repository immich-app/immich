import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AddUsersDto,
  AlbumResponseDto,
  AlbumsAddAssetsDto,
  AlbumsAddAssetsResponseDto,
  AlbumStatisticsResponseDto,
  CreateAlbumDto,
  GetAlbumsDto,
  mapAlbum,
  UpdateAlbumDto,
  UpdateAlbumUserDto,
} from 'src/dtos/album.dto';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerResponseDto } from 'src/dtos/map.dto';
import { AlbumUserRole, Permission } from 'src/enum';
import { AlbumAssetCount, AlbumInfoOptions } from 'src/repositories/album.repository';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';
import { asDateTimeString } from 'src/utils/date';
import { getPreferences } from 'src/utils/preferences';

@Injectable()
export class AlbumService extends BaseService {
  async getStatistics(auth: AuthDto): Promise<AlbumStatisticsResponseDto> {
    const [owned, shared, notShared] = await Promise.all([
      this.albumRepository.getAll(auth.user.id, { isOwned: true }),
      this.albumRepository.getAll(auth.user.id, { isShared: true }),
      this.albumRepository.getAll(auth.user.id, { isOwned: true, isShared: false }),
    ]);

    return {
      owned: owned.length,
      shared: shared.length,
      notShared: notShared.length,
    };
  }

  async getAll(auth: AuthDto, { assetId, ...rest }: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    const ownerId = auth.user.id;
    await this.albumRepository.updateThumbnails();

    const albums = assetId
      ? await this.albumRepository.getByAssetId(ownerId, assetId)
      : await this.albumRepository.getAll(ownerId, rest);

    if (albums.length === 0) {
      return [];
    }

    // PIN elevation is session-wide, not per-album: once elevated, the requester already has
    // standing access to open any of their locked albums with no extra friction. So it's safe
    // to also reveal locked albums' real counts here rather than showing a stale 0.
    const includeLockedAlbumAssets = !!auth.session?.hasElevatedPermission;

    // Get asset count for each album. Then map the result to an object:
    // { [albumId]: assetCount }
    const results = await this.albumRepository.getMetadataForIds(
      albums.map((album) => album.id),
      includeLockedAlbumAssets,
    );
    const albumMetadata: Record<string, AlbumAssetCount> = {};
    for (const metadata of results) {
      albumMetadata[metadata.albumId] = metadata;
    }

    return albums.map((album) => ({
      ...mapAlbum(album),
      sharedLinks: undefined,
      startDate: asDateTimeString(albumMetadata[album.id]?.startDate ?? undefined),
      endDate: asDateTimeString(albumMetadata[album.id]?.endDate ?? undefined),
      assetCount: albumMetadata[album.id]?.assetCount ?? 0,
      // lastModifiedAssetTimestamp is only used in mobile app, please remove if not need
      lastModifiedAssetTimestamp: asDateTimeString(albumMetadata[album.id]?.lastModifiedAssetTimestamp ?? undefined),
    }));
  }

  async get(auth: AuthDto, id: string): Promise<AlbumResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [id] });
    await this.albumRepository.updateThumbnails();
    const album = await this.findOrFail(id, auth.user.id, { withAssets: false });
    // requireAccess(AlbumRead) above already denies access to a locked album unless the
    // requester is elevated, so it's safe to include this album's Locked assets in its own
    // count/date-range metadata here.
    const [albumMetadataForIds] = await this.albumRepository.getMetadataForIds([album.id], true);

    const hasSharedUsers = album.albumUsers && album.albumUsers.length > 1;
    const hasSharedLink = album.sharedLinks && album.sharedLinks.length > 0;
    const isShared = hasSharedUsers || hasSharedLink;

    return {
      ...mapAlbum(album),
      startDate: asDateTimeString(albumMetadataForIds?.startDate ?? undefined),
      endDate: asDateTimeString(albumMetadataForIds?.endDate ?? undefined),
      assetCount: albumMetadataForIds?.assetCount ?? 0,
      lastModifiedAssetTimestamp: asDateTimeString(albumMetadataForIds?.lastModifiedAssetTimestamp ?? undefined),
      contributorCounts: isShared ? await this.albumRepository.getContributorCounts(album.id) : undefined,
    };
  }

  async getMapMarkers(auth: AuthDto, id: string): Promise<MapMarkerResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [id] });

    if (auth.sharedLink && !auth.sharedLink.showExif) {
      return [];
    }

    return this.mapRepository.getAlbumMapMarkers(id);
  }

  async create(auth: AuthDto, dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    const albumUsers = (dto.albumUsers || []).filter(({ userId }) => userId !== auth.user.id);

    for (const { userId } of albumUsers) {
      const exists = await this.userRepository.get(userId, {});
      if (!exists) {
        this.logger.debug('Album creation failed: user not found');
        throw new BadRequestException('Invalid user');
      }
    }

    const allowedAssetIdsSet = await this.checkAccess({
      auth,
      permission: Permission.AssetShare,
      ids: dto.assetIds || [],
    });
    const assetIds = [...allowedAssetIdsSet].map((id) => id);

    // A locked album can only ever be created already-locked, and can only ever contain assets
    // that are already locked (i.e. already sitting in the locked folder) -- there's no "lock an
    // existing album" conversion path anymore, so every asset given here must already have
    // Locked visibility, or creation is rejected outright.
    if (dto.isLocked && assetIds.length > 0) {
      const lockedAssetIds = await this.assetRepository.getLockedAssetIds(assetIds);
      if (lockedAssetIds.size !== assetIds.length) {
        throw new BadRequestException('A locked album can only contain assets that are already locked');
      }
    }

    const userMetadata = await this.userRepository.getMetadata(auth.user.id);

    const album = await this.albumRepository.create(
      {
        albumName: dto.albumName,
        description: dto.description,
        albumThumbnailAssetId: assetIds[0] || null,
        order: getPreferences(userMetadata).albums.defaultAssetOrder,
        isLocked: dto.isLocked ?? false,
      },
      assetIds,
      [{ userId: auth.user.id, role: AlbumUserRole.Owner }, ...albumUsers],
      auth.user.id,
    );

    for (const { userId } of albumUsers) {
      await this.eventRepository.emit('AlbumInvite', { id: album.id, userId, senderName: auth.user.name });
    }

    return mapAlbum(album);
  }

  async update(auth: AuthDto, id: string, dto: UpdateAlbumDto): Promise<AlbumResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AlbumUpdate, ids: [id] });

    const album = await this.findOrFail(id, auth.user.id, { withAssets: true });

    if (dto.albumThumbnailAssetId) {
      const results = await this.albumRepository.getAssetIds(id, [dto.albumThumbnailAssetId]);
      if (results.size === 0) {
        throw new BadRequestException('Invalid album thumbnail');
      }
    }
    const updatedAlbum = await this.albumRepository.update(
      album.id,
      {
        id: album.id,
        albumName: dto.albumName,
        description: dto.description,
        albumThumbnailAssetId: dto.albumThumbnailAssetId,
        isActivityEnabled: dto.isActivityEnabled,
        order: dto.order,
      },
      auth.user.id,
    );

    return mapAlbum({ ...updatedAlbum, assets: album.assets });
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AlbumDelete, ids: [id] });
    await this.albumRepository.delete(id);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const album = await this.findOrFail(id, auth.user.id, { withAssets: false });
    await this.requireAccess({ auth, permission: Permission.AlbumAssetCreate, ids: [id] });

    let results: BulkIdResponseDto[];

    if (album.isLocked) {
      // A locked album can only ever contain assets that are already locked (already sitting in
      // the locked folder) -- reject outright rather than silently dropping the offending assets.
      const lockedAssetIds = await this.assetRepository.getLockedAssetIds(dto.ids);
      if (lockedAssetIds.size !== dto.ids.length) {
        throw new BadRequestException('A locked album can only contain assets that are already locked');
      }

      // Can't use the shared addAssets() util below here: it gates each asset via
      // Permission.AssetShare, which hardcodes non-elevated access -- deliberately, since that
      // permission also covers shared-link/album-sharing paths that must never expose locked
      // content. Permission.AssetUpdate does respect elevation, and organizing an asset the
      // requester already owns (and has already locked) into a locked album they also own doesn't
      // expose it to anyone else, so it's the right check here.
      const existingAssetIds = await this.albumRepository.getAssetIds(id, dto.ids);
      const notPresentAssetIds = dto.ids.filter((assetId) => !existingAssetIds.has(assetId));

      // An asset can only ever belong to one locked album at a time -- if it's already in a
      // different locked album, reject it outright rather than silently moving it out of that
      // album.
      const conflictingAssetIds = await this.albumRepository.getAssetIdsInOtherLockedAlbums(notPresentAssetIds, id);
      const checkableAssetIds = notPresentAssetIds.filter((assetId) => !conflictingAssetIds.has(assetId));

      const allowedAssetIds = await this.checkAccess({
        auth,
        permission: Permission.AssetUpdate,
        ids: checkableAssetIds,
      });

      results = dto.ids.map((assetId) => {
        if (existingAssetIds.has(assetId)) {
          return { id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE };
        }
        if (conflictingAssetIds.has(assetId)) {
          return { id: assetId, success: false, error: BulkIdErrorReason.ALREADY_IN_LOCKED_ALBUM };
        }
        if (!allowedAssetIds.has(assetId)) {
          return { id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION };
        }
        return { id: assetId, success: true };
      });

      const newAssetIds = results.filter(({ success }) => success).map(({ id: assetId }) => assetId);
      if (newAssetIds.length > 0) {
        await this.albumRepository.addAssetIds(id, newAssetIds);
      }
    } else {
      results = await addAssets(
        auth,
        { access: this.accessRepository, bulk: this.albumRepository },
        { parentId: id, assetIds: dto.ids },
      );
    }

    const { id: firstNewAssetId } = results.find(({ success }) => success) || {};
    if (firstNewAssetId) {
      await this.albumRepository.update(
        id,
        {
          id,
          updatedAt: new Date(),
          albumThumbnailAssetId: album.albumThumbnailAssetId ?? firstNewAssetId,
        },
        auth.user.id,
      );

      const userIds = album.albumUsers.map(({ user }) => user.id);
      const recipientIds = userIds.filter((userId) => userId !== auth.user.id);
      await this.eventRepository.emit('AlbumUpdate', { id, userIds, recipientIds });
    }

    return results;
  }

  async addAssetsToAlbums(auth: AuthDto, dto: AlbumsAddAssetsDto): Promise<AlbumsAddAssetsResponseDto> {
    const results: AlbumsAddAssetsResponseDto = {
      success: false,
      error: BulkIdErrorReason.DUPLICATE,
    };

    const allowedAlbumIds = await this.checkAccess({
      auth,
      permission: Permission.AlbumAssetCreate,
      ids: dto.albumIds,
    });
    if (allowedAlbumIds.size === 0) {
      results.error = BulkIdErrorReason.NO_PERMISSION;
      return results;
    }

    // An asset can only ever belong to one locked album at a time -- so a single add-to-albums
    // call can target any number of unlocked albums together, or exactly one locked album alone,
    // but never 2+ locked albums or a locked+unlocked mix. Mirrors the client-side check in the
    // album picker, enforced here too for any caller.
    const lockedTargetAlbumIds = await this.albumRepository.getLockedAlbumIds([...allowedAlbumIds]);
    if (lockedTargetAlbumIds.size > 1 || (lockedTargetAlbumIds.size === 1 && allowedAlbumIds.size > 1)) {
      throw new BadRequestException('Assets can only be added to one locked album at a time');
    }

    const isLockedTarget = lockedTargetAlbumIds.size === 1;
    let allowedAssetIds: Set<string>;

    if (isLockedTarget) {
      // A locked album can only ever contain assets that are already locked (already sitting in
      // the locked folder) -- reject outright rather than converting/evicting them.
      const lockedAssetIds = await this.assetRepository.getLockedAssetIds(dto.assetIds);
      if (lockedAssetIds.size !== dto.assetIds.length) {
        throw new BadRequestException('A locked album can only contain assets that are already locked');
      }

      // An asset can only ever belong to one locked album at a time -- if it's already in a
      // different locked album, reject it outright rather than moving it out of that album.
      const [targetAlbumId] = lockedTargetAlbumIds;
      const conflictingAssetIds = await this.albumRepository.getAssetIdsInOtherLockedAlbums(
        dto.assetIds,
        targetAlbumId,
      );
      if (conflictingAssetIds.size === dto.assetIds.length) {
        results.error = BulkIdErrorReason.ALREADY_IN_LOCKED_ALBUM;
        return results;
      }
      const checkableAssetIds = dto.assetIds.filter((assetId) => !conflictingAssetIds.has(assetId));

      // Permission.AssetShare (used below for the unlocked-album path) hardcodes non-elevated
      // access, since it also covers shared-link/album-sharing paths that must never expose locked
      // content -- so it would reject every one of these assets outright. AssetUpdate respects
      // elevation, and organizing an asset the requester already owns into a locked album they
      // also own doesn't expose it to anyone else.
      allowedAssetIds = await this.checkAccess({ auth, permission: Permission.AssetUpdate, ids: checkableAssetIds });
    } else {
      allowedAssetIds = await this.checkAccess({ auth, permission: Permission.AssetShare, ids: dto.assetIds });
    }

    if (allowedAssetIds.size === 0) {
      results.error = BulkIdErrorReason.NO_PERMISSION;
      return results;
    }

    const albumAssetValues: { albumId: string; assetId: string }[] = [];
    const events: { id: string; userIds: string[]; recipientIds: string[] }[] = [];
    for (const albumId of allowedAlbumIds) {
      const existingAssetIds = await this.albumRepository.getAssetIds(albumId, [...allowedAssetIds]);
      const notPresentAssetIds = [...allowedAssetIds.difference(existingAssetIds)];
      if (notPresentAssetIds.length === 0) {
        continue;
      }
      const album = await this.findOrFail(albumId, auth.user.id, { withAssets: false });
      results.error = undefined;
      results.success = true;

      for (const assetId of notPresentAssetIds) {
        albumAssetValues.push({ albumId, assetId });
      }
      await this.albumRepository.update(
        albumId,
        {
          id: albumId,
          updatedAt: new Date(),
          albumThumbnailAssetId: album.albumThumbnailAssetId ?? notPresentAssetIds[0],
        },
        auth.user.id,
      );
      const userIds = album.albumUsers.map(({ user }) => user.id);
      const recipientIds = userIds.filter((userId) => userId !== auth.user.id);
      events.push({ id: albumId, userIds, recipientIds });
    }

    await this.albumRepository.addAssetIdsToAlbums(albumAssetValues);

    for (const event of events) {
      await this.eventRepository.emit('AlbumUpdate', event);
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AlbumAssetDelete, ids: [id] });

    const album = await this.findOrFail(id, auth.user.id, { withAssets: false });
    const results = await removeAssets(
      auth,
      { access: this.accessRepository, bulk: this.albumRepository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.AlbumDelete },
    );

    const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (removedIds.length > 0) {
      if (album.albumThumbnailAssetId && removedIds.includes(album.albumThumbnailAssetId)) {
        await this.albumRepository.updateThumbnails();
      }

      await this.eventRepository.emit('AlbumUpdate', {
        id,
        userIds: album.albumUsers.map(({ user }) => user.id),
        recipientIds: [],
      });
    }

    return results;
  }

  async addUsers(auth: AuthDto, id: string, { albumUsers }: AddUsersDto): Promise<AlbumResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AlbumShare, ids: [id] });

    const album = await this.findOrFail(id, auth.user.id, { withAssets: false });

    for (const { userId, role } of albumUsers) {
      if (role === AlbumUserRole.Owner) {
        throw new BadRequestException('Cannot add another owner');
      }

      const exists = album.albumUsers.some(({ user: { id } }) => id === userId);
      if (exists) {
        continue;
      }

      const user = await this.userRepository.get(userId, {});
      if (!user) {
        this.logger.debug('Adding user to album failed: user not found');
        throw new BadRequestException('Invalid user');
      }

      await this.albumUserRepository.create({ userId, albumId: id, role });
      await this.eventRepository.emit('AlbumInvite', { id, userId, senderName: auth.user.name });
    }

    return mapAlbum(await this.findOrFail(id, auth.user.id, { withAssets: true }));
  }

  async removeUser(auth: AuthDto, id: string, userId: string | 'me'): Promise<void> {
    if (userId === 'me') {
      userId = auth.user.id;
    }

    const album = await this.findOrFail(id, auth.user.id, { withAssets: false });

    const exists = album.albumUsers.find(({ user: { id } }) => id === userId);
    if (!exists) {
      throw new BadRequestException('Album not shared with user');
    }

    if (
      exists.role === AlbumUserRole.Owner &&
      album.albumUsers.filter(({ role }) => role === AlbumUserRole.Owner).length === 1
    ) {
      throw new BadRequestException('Cannot remove the last album owner');
    }

    // non-admin can remove themselves
    if (auth.user.id !== userId) {
      await this.requireAccess({ auth, permission: Permission.AlbumShare, ids: [id] });
    }

    await this.albumUserRepository.delete({ albumId: id, userId });
  }

  async updateUser(auth: AuthDto, id: string, userId: string, dto: UpdateAlbumUserDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AlbumShare, ids: [id] });

    const album = await this.findOrFail(id, userId, { withAssets: false });
    const owner = album.albumUsers[0];

    if (owner.user.id === userId) {
      throw new BadRequestException('User is owner');
    }

    await this.albumUserRepository.update({ albumId: id, userId }, { role: dto.role });
  }

  private async findOrFail(id: string, authUserId: string, options: AlbumInfoOptions) {
    const album = await this.albumRepository.getById(id, options, authUserId);
    if (!album) {
      throw new BadRequestException('Album not found');
    }
    return album;
  }
}
