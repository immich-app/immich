import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/hash.service.dart';
import 'package:immich_mobile/utils/async_mutex.dart';
import 'package:immich_mobile/extensions/collection_extensions.dart';
import 'package:immich_mobile/utils/datetime_comparison.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final syncServiceProvider = Provider(
  (ref) => SyncService(ref.watch(dbProvider), ref.watch(hashServiceProvider)),
);

class SyncService {
  final Isar _db;
  final HashService _hashService;
  final AsyncMutex _lock = AsyncMutex();
  final Logger _log = Logger('SyncService');

  SyncService(this._db, this._hashService);

  // public methods:

  /// Syncs users from the server to the local database
  /// Returns `true`if there were any changes
  Future<bool> syncUsersFromServer(List<User> users) =>
      _lock.run(() => _syncUsersFromServer(users));

  /// Syncs remote assets owned by the logged-in user to the DB
  /// Returns `true` if there were any changes
  Future<bool> syncRemoteAssetsToDb(
    User user,
    Future<(List<Asset>? toUpsert, List<String>? toDelete)> Function(
      User user,
      DateTime since,
    ) getChangedAssets,
    FutureOr<List<Asset>?> Function(User user) loadAssets,
  ) =>
      _lock.run(
        () async =>
            await _syncRemoteAssetChanges(user, getChangedAssets) ??
            await _syncRemoteAssetsFull(user, loadAssets),
      );

  /// Syncs remote albums to the database
  /// returns `true` if there were any changes
  Future<bool> syncRemoteAlbumsToDb(
    List<AlbumResponseDto> remote, {
    required bool isShared,
    required FutureOr<AlbumResponseDto> Function(AlbumResponseDto) loadDetails,
  }) =>
      _lock.run(() => _syncRemoteAlbumsToDb(remote, isShared, loadDetails));

  /// Syncs all device albums and their assets to the database
  /// Returns `true` if there were any changes
  Future<bool> syncLocalAlbumAssetsToDb(
    List<AssetPathEntity> onDevice, [
    Set<String>? excludedAssets,
  ]) =>
      _lock.run(() => _syncLocalAlbumAssetsToDb(onDevice, excludedAssets));

  /// returns all Asset IDs that are not contained in the existing list
  List<int> sharedAssetsToRemove(
    List<Asset> deleteCandidates,
    List<Asset> existing,
  ) {
    if (deleteCandidates.isEmpty) {
      return [];
    }
    deleteCandidates.sort(Asset.compareById);
    existing.sort(Asset.compareById);
    return _diffAssets(existing, deleteCandidates, compare: Asset.compareById)
        .$3
        .map((e) => e.id)
        .toList();
  }

  /// Syncs a new asset to the db. Returns `true` if successful
  Future<bool> syncNewAssetToDb(Asset newAsset) =>
      _lock.run(() => _syncNewAssetToDb(newAsset));

  Future<bool> removeAllLocalAlbumsAndAssets() =>
      _lock.run(_removeAllLocalAlbumsAndAssets);

  // private methods:

  /// Syncs users from the server to the local database
  /// Returns `true`if there were any changes
  Future<bool> _syncUsersFromServer(List<User> users) async {
    users.sortBy((u) => u.id);
    final dbUsers = await _db.users.where().sortById().findAll();
    assert(dbUsers.isSortedBy((u) => u.id), "dbUsers not sorted!");
    final List<int> toDelete = [];
    final List<User> toUpsert = [];
    final changes = diffSortedListsSync(
      users,
      dbUsers,
      compare: (User a, User b) => a.id.compareTo(b.id),
      both: (User a, User b) {
        if (!a.updatedAt.isAtSameMomentAs(b.updatedAt) ||
            a.isPartnerSharedBy != b.isPartnerSharedBy ||
            a.isPartnerSharedWith != b.isPartnerSharedWith) {
          toUpsert.add(a);
          return true;
        }
        return false;
      },
      onlyFirst: (User a) => toUpsert.add(a),
      onlySecond: (User b) => toDelete.add(b.isarId),
    );
    if (changes) {
      await _db.writeTxn(() async {
        await _db.users.deleteAll(toDelete);
        await _db.users.putAll(toUpsert);
      });
    }
    return changes;
  }

  /// Syncs a new asset to the db. Returns `true` if successful
  Future<bool> _syncNewAssetToDb(Asset a) async {
    final Asset? inDb =
        await _db.assets.getByOwnerIdChecksum(a.ownerId, a.checksum);
    if (inDb != null) {
      // unify local/remote assets by replacing the
      // local-only asset in the DB with a local&remote asset
      a = inDb.updatedCopy(a);
    }
    try {
      await _db.writeTxn(() => a.put(_db));
    } on IsarError catch (e) {
      _log.severe("Failed to put new asset into db", e);
      return false;
    }
    return true;
  }

  /// Efficiently syncs assets via changes. Returns `null` when a full sync is required.
  Future<bool?> _syncRemoteAssetChanges(
    User user,
    Future<(List<Asset>? toUpsert, List<String>? toDelete)> Function(
      User user,
      DateTime since,
    ) getChangedAssets,
  ) async {
    final DateTime? since = _db.eTags.getByIdSync(user.id)?.time?.toUtc();
    if (since == null) return null;
    final DateTime now = DateTime.now();
    final (toUpsert, toDelete) = await getChangedAssets(user, since);
    if (toUpsert == null || toDelete == null) return null;
    try {
      if (toDelete.isNotEmpty) {
        await handleRemoteAssetRemoval(toDelete);
      }
      if (toUpsert.isNotEmpty) {
        final (_, updated) = await _linkWithExistingFromDb(toUpsert);
        await upsertAssetsWithExif(updated);
      }
      if (toUpsert.isNotEmpty || toDelete.isNotEmpty) {
        await _updateUserAssetsETag(user, now);
        return true;
      }
      return false;
    } on IsarError catch (e) {
      _log.severe("Failed to sync remote assets to db", e);
    }
    return null;
  }

  /// Deletes remote-only assets, updates merged assets to be local-only
  Future<void> handleRemoteAssetRemoval(List<String> idsToDelete) {
    return _db.writeTxn(() async {
      final idsToRemove = await _db.assets
          .remote(idsToDelete)
          .filter()
          .localIdIsNull()
          .idProperty()
          .findAll();
      await _db.assets.deleteAll(idsToRemove);
      await _db.exifInfos.deleteAll(idsToRemove);
      final onlyLocal = await _db.assets.remote(idsToDelete).findAll();
      if (onlyLocal.isNotEmpty) {
        for (final Asset a in onlyLocal) {
          a.remoteId = null;
          a.isTrashed = false;
        }
        await _db.assets.putAll(onlyLocal);
      }
    });
  }

  /// Syncs assets by loading and comparing all assets from the server.
  Future<bool> _syncRemoteAssetsFull(
    User user,
    FutureOr<List<Asset>?> Function(User user) loadAssets,
  ) async {
    final DateTime now = DateTime.now().toUtc();
    final List<Asset>? remote = await loadAssets(user);
    if (remote == null) {
      return false;
    }
    final List<Asset> inDb = await _db.assets
        .where()
        .ownerIdEqualToAnyChecksum(user.isarId)
        .sortByChecksum()
        .findAll();
    assert(inDb.isSorted(Asset.compareByChecksum), "inDb not sorted!");

    remote.sort(Asset.compareByChecksum);

    // filter our duplicates that might be introduced by the chunked retrieval
    remote.uniqueConsecutive(compare: Asset.compareByChecksum);

    final (toAdd, toUpdate, toRemove) = _diffAssets(remote, inDb, remote: true);
    if (toAdd.isEmpty && toUpdate.isEmpty && toRemove.isEmpty) {
      await _updateUserAssetsETag(user, now);
      return false;
    }
    final idsToDelete = toRemove.map((e) => e.id).toList();
    try {
      await _db.writeTxn(() => _db.assets.deleteAll(idsToDelete));
      await upsertAssetsWithExif(toAdd + toUpdate);
    } on IsarError catch (e) {
      _log.severe("Failed to sync remote assets to db", e);
    }
    await _updateUserAssetsETag(user, now);
    return true;
  }

  Future<void> _updateUserAssetsETag(User user, DateTime time) =>
      _db.writeTxn(() => _db.eTags.put(ETag(id: user.id, time: time)));

  /// Syncs remote albums to the database
  /// returns `true` if there were any changes
  Future<bool> _syncRemoteAlbumsToDb(
    List<AlbumResponseDto> remote,
    bool isShared,
    FutureOr<AlbumResponseDto> Function(AlbumResponseDto) loadDetails,
  ) async {
    remote.sortBy((e) => e.id);

    final baseQuery = _db.albums.where().remoteIdIsNotNull().filter();
    final QueryBuilder<Album, Album, QAfterFilterCondition> query;
    if (isShared) {
      query = baseQuery.sharedEqualTo(true);
    } else {
      final User me = Store.get(StoreKey.currentUser);
      query = baseQuery.owner((q) => q.isarIdEqualTo(me.isarId));
    }
    final List<Album> dbAlbums = await query.sortByRemoteId().findAll();
    assert(dbAlbums.isSortedBy((e) => e.remoteId!), "dbAlbums not sorted!");

    final List<Asset> toDelete = [];
    final List<Asset> existing = [];

    final bool changes = await diffSortedLists(
      remote,
      dbAlbums,
      compare: (AlbumResponseDto a, Album b) => a.id.compareTo(b.remoteId!),
      both: (AlbumResponseDto a, Album b) =>
          _syncRemoteAlbum(a, b, toDelete, existing, loadDetails),
      onlyFirst: (AlbumResponseDto a) =>
          _addAlbumFromServer(a, existing, loadDetails),
      onlySecond: (Album a) => _removeAlbumFromDb(a, toDelete),
    );

    if (isShared && toDelete.isNotEmpty) {
      final List<int> idsToRemove = sharedAssetsToRemove(toDelete, existing);
      if (idsToRemove.isNotEmpty) {
        await _db.writeTxn(() async {
          await _db.assets.deleteAll(idsToRemove);
          await _db.exifInfos.deleteAll(idsToRemove);
        });
      }
    } else {
      assert(toDelete.isEmpty);
    }
    return changes;
  }

  /// syncs albums from the server to the local database (does not support
  /// syncing changes from local back to server)
  /// accumulates
  Future<bool> _syncRemoteAlbum(
    AlbumResponseDto dto,
    Album album,
    List<Asset> deleteCandidates,
    List<Asset> existing,
    FutureOr<AlbumResponseDto> Function(AlbumResponseDto) loadDetails,
  ) async {
    if (!_hasAlbumResponseDtoChanged(dto, album)) {
      return false;
    }
    // loadDetails (/api/album/:id) will not include lastModifiedAssetTimestamp,
    // i.e. it will always be null. Save it here.
    final originalDto = dto;
    dto = await loadDetails(dto);
    if (dto.assetCount != dto.assets.length) {
      return false;
    }
    final assetsInDb =
        await album.assets.filter().sortByOwnerId().thenByChecksum().findAll();
    assert(assetsInDb.isSorted(Asset.compareByOwnerChecksum), "inDb unsorted!");
    final List<Asset> assetsOnRemote = dto.getAssets();
    assetsOnRemote.sort(Asset.compareByOwnerChecksum);
    final (toAdd, toUpdate, toUnlink) = _diffAssets(
      assetsOnRemote,
      assetsInDb,
      compare: Asset.compareByOwnerChecksum,
    );

    // update shared users
    final List<User> sharedUsers = album.sharedUsers.toList(growable: false);
    sharedUsers.sort((a, b) => a.id.compareTo(b.id));
    dto.sharedUsers.sort((a, b) => a.id.compareTo(b.id));
    final List<String> userIdsToAdd = [];
    final List<User> usersToUnlink = [];
    diffSortedListsSync(
      dto.sharedUsers,
      sharedUsers,
      compare: (UserResponseDto a, User b) => a.id.compareTo(b.id),
      both: (a, b) => false,
      onlyFirst: (UserResponseDto a) => userIdsToAdd.add(a.id),
      onlySecond: (User a) => usersToUnlink.add(a),
    );

    // for shared album: put missing album assets into local DB
    final (existingInDb, updated) = await _linkWithExistingFromDb(toAdd);
    await upsertAssetsWithExif(updated);
    final assetsToLink = existingInDb + updated;
    final usersToLink = (await _db.users.getAllById(userIdsToAdd)).cast<User>();

    album.name = dto.albumName;
    album.shared = dto.shared;
    album.createdAt = dto.createdAt;
    album.modifiedAt = dto.updatedAt;
    album.startDate = dto.startDate;
    album.endDate = dto.endDate;
    album.lastModifiedAssetTimestamp = originalDto.lastModifiedAssetTimestamp;
    album.shared = dto.shared;
    album.activityEnabled = dto.isActivityEnabled;
    if (album.thumbnail.value?.remoteId != dto.albumThumbnailAssetId) {
      album.thumbnail.value = await _db.assets
          .where()
          .remoteIdEqualTo(dto.albumThumbnailAssetId)
          .findFirst();
    }

    // write & commit all changes to DB
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(toUpdate);
        await album.thumbnail.save();
        await album.sharedUsers
            .update(link: usersToLink, unlink: usersToUnlink);
        await album.assets.update(link: assetsToLink, unlink: toUnlink.cast());
        await _db.albums.put(album);
      });
      _log.info("Synced changes of remote album ${album.name} to DB");
    } on IsarError catch (e) {
      _log.severe("Failed to sync remote album to database", e);
    }

    if (album.shared || dto.shared) {
      final userId = Store.get(StoreKey.currentUser).isarId;
      final foreign =
          await album.assets.filter().not().ownerIdEqualTo(userId).findAll();
      existing.addAll(foreign);

      // delete assets in DB unless they belong to this user or part of some other shared album
      deleteCandidates.addAll(toUnlink.where((a) => a.ownerId != userId));
    }

    return true;
  }

  /// Adds a remote album to the database while making sure to add any foreign
  /// (shared) assets to the database beforehand
  /// accumulates assets already existing in the database
  Future<void> _addAlbumFromServer(
    AlbumResponseDto dto,
    List<Asset> existing,
    FutureOr<AlbumResponseDto> Function(AlbumResponseDto) loadDetails,
  ) async {
    if (dto.assetCount != dto.assets.length) {
      dto = await loadDetails(dto);
    }
    if (dto.assetCount == dto.assets.length) {
      // in case an album contains assets not yet present in local DB:
      // put missing album assets into local DB
      final (existingInDb, updated) =
          await _linkWithExistingFromDb(dto.getAssets());
      existing.addAll(existingInDb);
      await upsertAssetsWithExif(updated);

      final Album a = await Album.remote(dto);
      await _db.writeTxn(() => _db.albums.store(a));
    } else {
      _log.warning(
          "Failed to add album from server: assetCount ${dto.assetCount} != "
          "asset array length ${dto.assets.length} for album ${dto.albumName}");
    }
  }

  /// Accumulates all suitable album assets to the `deleteCandidates` and
  /// removes the album from the database.
  Future<void> _removeAlbumFromDb(
    Album album,
    List<Asset> deleteCandidates,
  ) async {
    if (album.isLocal) {
      _log.info("Removing local album $album from DB");
      // delete assets in DB unless they are remote or part of some other album
      deleteCandidates.addAll(
        await album.assets.filter().remoteIdIsNull().findAll(),
      );
    } else if (album.shared) {
      final User user = Store.get(StoreKey.currentUser);
      // delete assets in DB unless they belong to this user or are part of some other shared album or belong to a partner
      final userIds = await _db.users
          .filter()
          .isPartnerSharedWithEqualTo(true)
          .isarIdProperty()
          .findAll();
      userIds.add(user.isarId);
      final orphanedAssets = await album.assets
          .filter()
          .not()
          .anyOf(userIds, (q, int id) => q.ownerIdEqualTo(id))
          .findAll();
      deleteCandidates.addAll(orphanedAssets);
    }
    try {
      final bool ok = await _db.writeTxn(() => _db.albums.delete(album.id));
      assert(ok);
      _log.info("Removed local album $album from DB");
    } catch (e) {
      _log.severe("Failed to remove local album $album from DB", e);
    }
  }

  /// Syncs all device albums and their assets to the database
  /// Returns `true` if there were any changes
  Future<bool> _syncLocalAlbumAssetsToDb(
    List<AssetPathEntity> onDevice, [
    Set<String>? excludedAssets,
  ]) async {
    onDevice.sort((a, b) => a.id.compareTo(b.id));
    final inDb =
        await _db.albums.where().localIdIsNotNull().sortByLocalId().findAll();
    final List<Asset> deleteCandidates = [];
    final List<Asset> existing = [];
    assert(inDb.isSorted((a, b) => a.localId!.compareTo(b.localId!)), "sort!");
    final bool anyChanges = await diffSortedLists(
      onDevice,
      inDb,
      compare: (AssetPathEntity a, Album b) => a.id.compareTo(b.localId!),
      both: (AssetPathEntity ape, Album album) => _syncAlbumInDbAndOnDevice(
        ape,
        album,
        deleteCandidates,
        existing,
        excludedAssets,
      ),
      onlyFirst: (AssetPathEntity ape) =>
          _addAlbumFromDevice(ape, existing, excludedAssets),
      onlySecond: (Album a) => _removeAlbumFromDb(a, deleteCandidates),
    );
    _log.fine(
      "Syncing all local albums almost done. Collected ${deleteCandidates.length} asset candidates to delete",
    );
    final (toDelete, toUpdate) =
        _handleAssetRemoval(deleteCandidates, existing, remote: false);
    _log.fine(
      "${toDelete.length} assets to delete, ${toUpdate.length} to update",
    );
    if (toDelete.isNotEmpty || toUpdate.isNotEmpty) {
      await _db.writeTxn(() async {
        await _db.assets.deleteAll(toDelete);
        await _db.exifInfos.deleteAll(toDelete);
        await _db.assets.putAll(toUpdate);
      });
      _log.info(
        "Removed ${toDelete.length} and updated ${toUpdate.length} local assets from DB",
      );
    }
    return anyChanges;
  }

  /// Syncs the device album to the album in the database
  /// returns `true` if there were any changes
  /// Accumulates asset candidates to delete and those already existing in DB
  Future<bool> _syncAlbumInDbAndOnDevice(
    AssetPathEntity ape,
    Album album,
    List<Asset> deleteCandidates,
    List<Asset> existing, [
    Set<String>? excludedAssets,
    bool forceRefresh = false,
  ]) async {
    if (!forceRefresh && !await _hasAssetPathEntityChanged(ape, album)) {
      _log.fine("Local album ${ape.name} has not changed. Skipping sync.");
      return false;
    }
    if (!forceRefresh &&
        excludedAssets == null &&
        await _syncDeviceAlbumFast(ape, album)) {
      return true;
    }

    // general case, e.g. some assets have been deleted or there are excluded albums on iOS
    final inDb = await album.assets
        .filter()
        .ownerIdEqualTo(Store.get(StoreKey.currentUser).isarId)
        .sortByChecksum()
        .findAll();
    assert(inDb.isSorted(Asset.compareByChecksum), "inDb not sorted!");
    final int assetCountOnDevice = await ape.assetCountAsync;
    final List<Asset> onDevice =
        await _hashService.getHashedAssets(ape, excludedAssets: excludedAssets);
    _removeDuplicates(onDevice);
    // _removeDuplicates sorts `onDevice` by checksum
    final (toAdd, toUpdate, toDelete) = _diffAssets(onDevice, inDb);
    if (toAdd.isEmpty &&
        toUpdate.isEmpty &&
        toDelete.isEmpty &&
        album.name == ape.name &&
        ape.lastModified != null &&
        album.modifiedAt.isAtSameMomentAs(ape.lastModified!)) {
      // changes only affeted excluded albums
      _log.fine(
        "Only excluded assets in local album ${ape.name} changed. Stopping sync.",
      );
      if (assetCountOnDevice !=
          _db.eTags.getByIdSync(ape.eTagKeyAssetCount)?.assetCount) {
        await _db.writeTxn(
          () => _db.eTags.put(
            ETag(id: ape.eTagKeyAssetCount, assetCount: assetCountOnDevice),
          ),
        );
      }
      return false;
    }
    _log.fine(
      "Syncing local album ${ape.name}. ${toAdd.length} assets to add, ${toUpdate.length} to update, ${toDelete.length} to delete",
    );
    final (existingInDb, updated) = await _linkWithExistingFromDb(toAdd);
    _log.fine(
      "Linking assets to add with existing from db. ${existingInDb.length} existing, ${updated.length} to update",
    );
    deleteCandidates.addAll(toDelete);
    existing.addAll(existingInDb);
    album.name = ape.name;
    album.modifiedAt = ape.lastModified ?? DateTime.now();
    if (album.thumbnail.value != null &&
        toDelete.contains(album.thumbnail.value)) {
      album.thumbnail.value = null;
    }
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(updated);
        await _db.assets.putAll(toUpdate);
        await album.assets
            .update(link: existingInDb + updated, unlink: toDelete);
        await _db.albums.put(album);
        album.thumbnail.value ??= await album.assets.filter().findFirst();
        await album.thumbnail.save();
        await _db.eTags.put(
          ETag(id: ape.eTagKeyAssetCount, assetCount: assetCountOnDevice),
        );
      });
      _log.info("Synced changes of local album ${ape.name} to DB");
    } on IsarError catch (e) {
      _log.severe("Failed to update synced album ${ape.name} in DB", e);
    }

    return true;
  }

  /// fast path for common case: only new assets were added to device album
  /// returns `true` if successfull, else `false`
  Future<bool> _syncDeviceAlbumFast(AssetPathEntity ape, Album album) async {
    if (!(ape.lastModified ?? DateTime.now()).isAfter(album.modifiedAt)) {
      return false;
    }
    final int totalOnDevice = await ape.assetCountAsync;
    final int lastKnownTotal =
        (await _db.eTags.getById(ape.eTagKeyAssetCount))?.assetCount ?? 0;
    final AssetPathEntity? modified = totalOnDevice > lastKnownTotal
        ? await ape.fetchPathProperties(
            filterOptionGroup: FilterOptionGroup(
              updateTimeCond: DateTimeCond(
                min: album.modifiedAt.add(const Duration(seconds: 1)),
                max: ape.lastModified ?? DateTime.now(),
              ),
            ),
          )
        : null;
    if (modified == null) {
      return false;
    }
    final List<Asset> newAssets = await _hashService.getHashedAssets(modified);

    if (totalOnDevice != lastKnownTotal + newAssets.length) {
      return false;
    }
    album.modifiedAt = ape.lastModified ?? DateTime.now();
    _removeDuplicates(newAssets);
    final (existingInDb, updated) = await _linkWithExistingFromDb(newAssets);
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(updated);
        await album.assets.update(link: existingInDb + updated);
        await _db.albums.put(album);
        await _db.eTags
            .put(ETag(id: ape.eTagKeyAssetCount, assetCount: totalOnDevice));
      });
      _log.info("Fast synced local album ${ape.name} to DB");
    } on IsarError catch (e) {
      _log.severe("Failed to fast sync local album ${ape.name} to DB", e);
      return false;
    }

    return true;
  }

  /// Adds a new album from the device to the database and Accumulates all
  /// assets already existing in the database to the list of `existing` assets
  Future<void> _addAlbumFromDevice(
    AssetPathEntity ape,
    List<Asset> existing, [
    Set<String>? excludedAssets,
  ]) async {
    _log.info("Syncing a new local album to DB: ${ape.name}");
    final Album a = Album.local(ape);
    final assets =
        await _hashService.getHashedAssets(ape, excludedAssets: excludedAssets);
    _removeDuplicates(assets);
    final (existingInDb, updated) = await _linkWithExistingFromDb(assets);
    _log.info(
      "${existingInDb.length} assets already existed in DB, to upsert ${updated.length}",
    );
    await upsertAssetsWithExif(updated);
    existing.addAll(existingInDb);
    a.assets.addAll(existingInDb);
    a.assets.addAll(updated);
    final thumb = existingInDb.firstOrNull ?? updated.firstOrNull;
    a.thumbnail.value = thumb;
    try {
      await _db.writeTxn(() => _db.albums.store(a));
      _log.info("Added a new local album to DB: ${ape.name}");
    } on IsarError catch (e) {
      _log.severe("Failed to add new local album ${ape.name} to DB", e);
    }
  }

  /// Returns a tuple (existing, updated)
  Future<(List<Asset> existing, List<Asset> updated)> _linkWithExistingFromDb(
    List<Asset> assets,
  ) async {
    if (assets.isEmpty) return ([].cast<Asset>(), [].cast<Asset>());

    final List<Asset?> inDb = await _db.assets.getAllByOwnerIdChecksum(
      assets.map((a) => a.ownerId).toInt64List(),
      assets.map((a) => a.checksum).toList(growable: false),
    );
    assert(inDb.length == assets.length);
    final List<Asset> existing = [], toUpsert = [];
    for (int i = 0; i < assets.length; i++) {
      final Asset? b = inDb[i];
      if (b == null) {
        toUpsert.add(assets[i]);
        continue;
      }
      if (b.canUpdate(assets[i])) {
        final updated = b.updatedCopy(assets[i]);
        assert(updated.id != Isar.autoIncrement);
        toUpsert.add(updated);
      } else {
        existing.add(b);
      }
    }
    assert(existing.length + toUpsert.length == assets.length);
    return (existing, toUpsert);
  }

  /// Inserts or updates the assets in the database with their ExifInfo (if any)
  Future<void> upsertAssetsWithExif(List<Asset> assets) async {
    if (assets.isEmpty) {
      return;
    }
    final exifInfos = assets.map((e) => e.exifInfo).whereNotNull().toList();
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(assets);
        for (final Asset added in assets) {
          added.exifInfo?.id = added.id;
        }
        await _db.exifInfos.putAll(exifInfos);
      });
      _log.info("Upserted ${assets.length} assets into the DB");
    } on IsarError catch (e) {
      _log.severe("Failed to upsert ${assets.length} assets into the DB", e);
      // give details on the errors
      assets.sort(Asset.compareByOwnerChecksum);
      final inDb = await _db.assets.getAllByOwnerIdChecksum(
        assets.map((e) => e.ownerId).toInt64List(),
        assets.map((e) => e.checksum).toList(growable: false),
      );
      for (int i = 0; i < assets.length; i++) {
        final Asset a = assets[i];
        final Asset? b = inDb[i];
        if (b == null) {
          if (a.id != Isar.autoIncrement) {
            _log.warning(
              "Trying to update an asset that does not exist in DB:\n$a",
            );
          }
        } else if (a.id != b.id) {
          _log.warning(
            "Trying to insert another asset with the same checksum+owner. In DB:\n$b\nTo insert:\n$a",
          );
        }
      }
      for (int i = 1; i < assets.length; i++) {
        if (Asset.compareByOwnerChecksum(assets[i - 1], assets[i]) == 0) {
          _log.warning(
            "Trying to insert duplicate assets:\n${assets[i - 1]}\n${assets[i]}",
          );
        }
      }
    }
  }

  List<Asset> _removeDuplicates(List<Asset> assets) {
    final int before = assets.length;
    assets.sort(Asset.compareByOwnerChecksumCreatedModified);
    assets.uniqueConsecutive(
      compare: Asset.compareByOwnerChecksum,
      onDuplicate: (a, b) =>
          _log.info("Ignoring duplicate assets on device:\n$a\n$b"),
    );
    final int duplicates = before - assets.length;
    if (duplicates > 0) {
      _log.warning("Ignored $duplicates duplicate assets on device");
    }
    return assets;
  }

  /// returns `true` if the albums differ on the surface
  Future<bool> _hasAssetPathEntityChanged(AssetPathEntity a, Album b) async {
    return a.name != b.name ||
        a.lastModified == null ||
        !a.lastModified!.isAtSameMomentAs(b.modifiedAt) ||
        await a.assetCountAsync !=
            (await _db.eTags.getById(a.eTagKeyAssetCount))?.assetCount;
  }

  Future<bool> _removeAllLocalAlbumsAndAssets() async {
    try {
      final assets = await _db.assets.where().localIdIsNotNull().findAll();
      final (toDelete, toUpdate) =
          _handleAssetRemoval(assets, [], remote: false);
      await _db.writeTxn(() async {
        await _db.assets.deleteAll(toDelete);
        await _db.assets.putAll(toUpdate);
        await _db.albums.where().localIdIsNotNull().deleteAll();
      });
      return true;
    } catch (e) {
      _log.severe("Failed to remove all local albums and assets", e);
      return false;
    }
  }
}

/// Returns a triple(toAdd, toUpdate, toRemove)
(List<Asset> toAdd, List<Asset> toUpdate, List<Asset> toRemove) _diffAssets(
  List<Asset> assets,
  List<Asset> inDb, {
  bool? remote,
  int Function(Asset, Asset) compare = Asset.compareByChecksum,
}) {
  // fast paths for trivial cases: reduces memory usage during initial sync etc.
  if (assets.isEmpty && inDb.isEmpty) {
    return const ([], [], []);
  } else if (assets.isEmpty && remote == null) {
    // remove all from database
    return (const [], const [], inDb);
  } else if (inDb.isEmpty) {
    // add all assets
    return (assets, const [], const []);
  }

  final List<Asset> toAdd = [];
  final List<Asset> toUpdate = [];
  final List<Asset> toRemove = [];
  diffSortedListsSync(
    inDb,
    assets,
    compare: compare,
    both: (Asset a, Asset b) {
      if (a.canUpdate(b)) {
        toUpdate.add(a.updatedCopy(b));
        return true;
      }
      return false;
    },
    onlyFirst: (Asset a) {
      if (remote == true && a.isLocal) {
        if (a.remoteId != null) {
          a.remoteId = null;
          toUpdate.add(a);
        }
      } else if (remote == false && a.isRemote) {
        if (a.isLocal) {
          a.localId = null;
          toUpdate.add(a);
        }
      } else {
        toRemove.add(a);
      }
    },
    onlySecond: (Asset b) => toAdd.add(b),
  );
  return (toAdd, toUpdate, toRemove);
}

/// returns a tuple (toDelete toUpdate) when assets are to be deleted
(List<int> toDelete, List<Asset> toUpdate) _handleAssetRemoval(
  List<Asset> deleteCandidates,
  List<Asset> existing, {
  bool? remote,
}) {
  if (deleteCandidates.isEmpty) {
    return const ([], []);
  }
  deleteCandidates.sort(Asset.compareById);
  deleteCandidates.uniqueConsecutive(compare: Asset.compareById);
  existing.sort(Asset.compareById);
  existing.uniqueConsecutive(compare: Asset.compareById);
  final (tooAdd, toUpdate, toRemove) = _diffAssets(
    existing,
    deleteCandidates,
    compare: Asset.compareById,
    remote: remote,
  );
  assert(tooAdd.isEmpty, "toAdd should be empty in _handleAssetRemoval");
  return (toRemove.map((e) => e.id).toList(), toUpdate);
}

/// returns `true` if the albums differ on the surface
bool _hasAlbumResponseDtoChanged(AlbumResponseDto dto, Album a) {
  return dto.assetCount != a.assetCount ||
      dto.albumName != a.name ||
      dto.albumThumbnailAssetId != a.thumbnail.value?.remoteId ||
      dto.shared != a.shared ||
      dto.sharedUsers.length != a.sharedUsers.length ||
      !dto.updatedAt.isAtSameMomentAs(a.modifiedAt) ||
      !isAtSameMomentAs(dto.startDate, a.startDate) ||
      !isAtSameMomentAs(dto.endDate, a.endDate) ||
      !isAtSameMomentAs(
        dto.lastModifiedAssetTimestamp,
        a.lastModifiedAssetTimestamp,
      );
}
