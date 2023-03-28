import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/async_mutex.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:immich_mobile/utils/tuple.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final syncServiceProvider =
    Provider((ref) => SyncService(ref.watch(dbProvider)));

class SyncService {
  final Isar _db;
  final AsyncMutex _lock = AsyncMutex();
  final Logger _log = Logger('SyncService');

  SyncService(this._db);

  // public methods:

  /// Syncs users from the server to the local database
  /// Returns `true`if there were any changes
  Future<bool> syncUsersFromServer(List<User> users) async {
    users.sortBy((u) => u.id);
    final dbUsers = await _db.users.where().sortById().findAll();
    final List<int> toDelete = [];
    final List<User> toUpsert = [];
    final changes = diffSortedListsSync(
      users,
      dbUsers,
      compare: (User a, User b) => a.id.compareTo(b.id),
      both: (User a, User b) {
        if (a.updatedAt != b.updatedAt) {
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

  /// Syncs remote assets owned by the logged-in user to the DB
  /// Returns `true` if there were any changes
  Future<bool> syncRemoteAssetsToDb(
    FutureOr<List<Asset>?> Function() loadAssets,
  ) =>
      _lock.run(() => _syncRemoteAssetsToDb(loadAssets));

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
        .third
        .map((e) => e.id)
        .toList();
  }

  /// Syncs a new asset to the db. Returns `true` if successful
  Future<bool> syncNewAssetToDb(Asset newAsset) =>
      _lock.run(() => _syncNewAssetToDb(newAsset));

  // private methods:

  /// Syncs a new asset to the db. Returns `true` if successful
  Future<bool> _syncNewAssetToDb(Asset newAsset) async {
    final List<Asset> inDb = await _db.assets
        .where()
        .localIdDeviceIdEqualTo(newAsset.localId, newAsset.deviceId)
        .findAll();
    Asset? match;
    if (inDb.length == 1) {
      // exactly one match: trivial case
      match = inDb.first;
    } else if (inDb.length > 1) {
      // TODO instead of this heuristics: match by checksum once available
      for (Asset a in inDb) {
        if (a.ownerId == newAsset.ownerId &&
            a.fileModifiedAt == newAsset.fileModifiedAt) {
          assert(match == null);
          match = a;
        }
      }
      if (match == null) {
        for (Asset a in inDb) {
          if (a.ownerId == newAsset.ownerId) {
            assert(match == null);
            match = a;
          }
        }
      }
    }
    if (match != null) {
      // unify local/remote assets by replacing the
      // local-only asset in the DB with a local&remote asset
      newAsset.updateFromDb(match);
    }
    try {
      await _db.writeTxn(() => newAsset.put(_db));
    } on IsarError catch (e) {
      _log.severe("Failed to put new asset into db: $e");
      return false;
    }
    return true;
  }

  /// Syncs remote assets to the databas
  /// returns `true` if there were any changes
  Future<bool> _syncRemoteAssetsToDb(
    FutureOr<List<Asset>?> Function() loadAssets,
  ) async {
    final List<Asset>? remote = await loadAssets();
    if (remote == null) {
      return false;
    }
    final User user = Store.get(StoreKey.currentUser);
    final List<Asset> inDb = await _db.assets
        .filter()
        .ownerIdEqualTo(user.isarId)
        .sortByDeviceId()
        .thenByLocalId()
        .thenByFileModifiedAt()
        .findAll();
    remote.sort(Asset.compareByOwnerDeviceLocalIdModified);
    final diff = _diffAssets(remote, inDb, remote: true);
    if (diff.first.isEmpty && diff.second.isEmpty && diff.third.isEmpty) {
      return false;
    }
    final idsToDelete = diff.third.map((e) => e.id).toList();
    try {
      await _db.writeTxn(() => _db.assets.deleteAll(idsToDelete));
      await _upsertAssetsWithExif(diff.first + diff.second);
    } on IsarError catch (e) {
      _log.severe("Failed to sync remote assets to db: $e");
    }
    return true;
  }

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
    dto = await loadDetails(dto);
    if (dto.assetCount != dto.assets.length) {
      return false;
    }
    final assetsInDb = await album.assets
        .filter()
        .sortByOwnerId()
        .thenByDeviceId()
        .thenByLocalId()
        .thenByFileModifiedAt()
        .findAll();
    final List<Asset> assetsOnRemote = dto.getAssets();
    assetsOnRemote.sort(Asset.compareByOwnerDeviceLocalIdModified);
    final d = _diffAssets(assetsOnRemote, assetsInDb);
    final List<Asset> toAdd = d.first, toUpdate = d.second, toUnlink = d.third;

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
    final resultPair = await _linkWithExistingFromDb(toAdd);
    await _upsertAssetsWithExif(resultPair.second);
    final assetsToLink = resultPair.first + resultPair.second;
    final usersToLink = (await _db.users.getAllById(userIdsToAdd)).cast<User>();

    album.name = dto.albumName;
    album.shared = dto.shared;
    album.modifiedAt = DateTime.parse(dto.updatedAt).toUtc();
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
    } on IsarError catch (e) {
      _log.severe("Failed to sync remote album to database $e");
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
      final result = await _linkWithExistingFromDb(dto.getAssets());
      existing.addAll(result.first);
      await _upsertAssetsWithExif(result.second);

      final Album a = await Album.remote(dto);
      await _db.writeTxn(() => _db.albums.store(a));
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
      // delete assets in DB unless they belong to this user or are part of some other shared album
      deleteCandidates.addAll(
        await album.assets.filter().not().ownerIdEqualTo(user.isarId).findAll(),
      );
    }
    try {
      final bool ok = await _db.writeTxn(() => _db.albums.delete(album.id));
      assert(ok);
      _log.info("Removed local album $album from DB");
    } catch (e) {
      _log.severe("Failed to remove local album $album from DB");
    }
  }

  /// Syncs all device albums and their assets to the database
  /// Returns `true` if there were any changes
  Future<bool> _syncLocalAlbumAssetsToDb(
    List<AssetPathEntity> onDevice, [
    Set<String>? excludedAssets,
  ]) async {
    _log.info("Syncing ${onDevice.length} albums from device: $onDevice");
    onDevice.sort((a, b) => a.id.compareTo(b.id));
    final List<Album> inDb =
        await _db.albums.where().localIdIsNotNull().sortByLocalId().findAll();
    final List<Asset> deleteCandidates = [];
    final List<Asset> existing = [];
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
    final pair = _handleAssetRemoval(deleteCandidates, existing, remote: false);
    if (pair.first.isNotEmpty || pair.second.isNotEmpty) {
      await _db.writeTxn(() async {
        await _db.assets.deleteAll(pair.first);
        await _db.exifInfos.deleteAll(pair.first);
        await _db.assets.putAll(pair.second);
      });
      _log.info(
        "Removed ${pair.first.length} and updated ${pair.second.length} local assets from DB",
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
        .deviceIdEqualTo(Store.get(StoreKey.deviceIdHash))
        .sortByLocalId()
        .findAll();
    final List<Asset> onDevice =
        await ape.getAssets(excludedAssets: excludedAssets);
    onDevice.sort(Asset.compareByLocalId);
    final d = _diffAssets(onDevice, inDb, compare: Asset.compareByLocalId);
    final List<Asset> toAdd = d.first, toUpdate = d.second, toDelete = d.third;
    if (toAdd.isEmpty &&
        toUpdate.isEmpty &&
        toDelete.isEmpty &&
        album.name == ape.name &&
        album.modifiedAt == ape.lastModified) {
      // changes only affeted excluded albums
      return false;
    }
    final result = await _linkWithExistingFromDb(toAdd);
    deleteCandidates.addAll(toDelete);
    existing.addAll(result.first);
    album.name = ape.name;
    album.modifiedAt = ape.lastModified!;
    if (album.thumbnail.value != null &&
        toDelete.contains(album.thumbnail.value)) {
      album.thumbnail.value = null;
    }
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(result.second);
        await _db.assets.putAll(toUpdate);
        await album.assets
            .update(link: result.first + result.second, unlink: toDelete);
        await _db.albums.put(album);
        album.thumbnail.value ??= await album.assets.filter().findFirst();
        await album.thumbnail.save();
      });
      _log.info("Synced changes of local album $ape to DB");
    } on IsarError catch (e) {
      _log.severe("Failed to update synced album $ape in DB: $e");
    }

    return true;
  }

  /// fast path for common case: only new assets were added to device album
  /// returns `true` if successfull, else `false`
  Future<bool> _syncDeviceAlbumFast(AssetPathEntity ape, Album album) async {
    final int totalOnDevice = await ape.assetCountAsync;
    final AssetPathEntity? modified = totalOnDevice > album.assetCount
        ? await ape.fetchPathProperties(
            filterOptionGroup: FilterOptionGroup(
              updateTimeCond: DateTimeCond(
                min: album.modifiedAt.add(const Duration(seconds: 1)),
                max: ape.lastModified!,
              ),
            ),
          )
        : null;
    if (modified == null) {
      return false;
    }
    final List<Asset> newAssets = await modified.getAssets();
    if (totalOnDevice != album.assets.length + newAssets.length) {
      return false;
    }
    album.modifiedAt = ape.lastModified!.toUtc();
    final result = await _linkWithExistingFromDb(newAssets);
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(result.second);
        await album.assets.update(link: result.first + result.second);
        await _db.albums.put(album);
      });
      _log.info("Fast synced local album $ape to DB");
    } on IsarError catch (e) {
      _log.severe("Failed to fast sync local album $ape to DB: $e");
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
    _log.info("Syncing a new local album to DB: $ape");
    final Album a = Album.local(ape);
    final result = await _linkWithExistingFromDb(
      await ape.getAssets(excludedAssets: excludedAssets),
    );
    _log.info(
      "${result.first.length} assets already existed in DB, to upsert ${result.second.length}",
    );
    await _upsertAssetsWithExif(result.second);
    existing.addAll(result.first);
    a.assets.addAll(result.first);
    a.assets.addAll(result.second);
    final thumb = result.first.firstOrNull ?? result.second.firstOrNull;
    a.thumbnail.value = thumb;
    try {
      await _db.writeTxn(() => _db.albums.store(a));
      _log.info("Added a new local album to DB: $ape");
    } on IsarError catch (e) {
      _log.severe("Failed to add new local album $ape to DB: $e");
    }
  }

  /// Returns a tuple (existing, updated)
  Future<Pair<List<Asset>, List<Asset>>> _linkWithExistingFromDb(
    List<Asset> assets,
  ) async {
    if (assets.isEmpty) {
      return const Pair([], []);
    }
    final List<Asset> inDb = await _db.assets
        .where()
        .anyOf(
          assets,
          (q, Asset e) => q.localIdDeviceIdEqualTo(e.localId, e.deviceId),
        )
        .sortByOwnerId()
        .thenByDeviceId()
        .thenByLocalId()
        .thenByFileModifiedAt()
        .findAll();
    assets.sort(Asset.compareByOwnerDeviceLocalIdModified);
    final List<Asset> existing = [], toUpsert = [];
    diffSortedListsSync(
      inDb,
      assets,
      // do not compare by modified date because for some assets dates differ on
      // client and server, thus never reaching "both" case below
      compare: Asset.compareByOwnerDeviceLocalId,
      both: (Asset a, Asset b) {
        if ((a.isLocal || !b.isLocal) &&
            (a.isRemote || !b.isRemote) &&
            a.updatedAt == b.updatedAt) {
          existing.add(a);
          return false;
        } else {
          toUpsert.add(b.updateFromDb(a));
          return true;
        }
      },
      onlyFirst: (Asset a) => throw Exception("programming error"),
      onlySecond: (Asset b) => toUpsert.add(b),
    );
    return Pair(existing, toUpsert);
  }

  /// Inserts or updates the assets in the database with their ExifInfo (if any)
  Future<void> _upsertAssetsWithExif(List<Asset> assets) async {
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
      _log.warning(
        "Failed to upsert ${assets.length} assets into the DB: ${e.toString()}",
      );
    }
  }
}

/// Returns a triple(toAdd, toUpdate, toRemove)
Triple<List<Asset>, List<Asset>, List<Asset>> _diffAssets(
  List<Asset> assets,
  List<Asset> inDb, {
  bool? remote,
  int Function(Asset, Asset) compare = Asset.compareByOwnerDeviceLocalId,
}) {
  final List<Asset> toAdd = [];
  final List<Asset> toUpdate = [];
  final List<Asset> toRemove = [];
  diffSortedListsSync(
    inDb,
    assets,
    compare: compare,
    both: (Asset a, Asset b) {
      if (a.updatedAt.isBefore(b.updatedAt) ||
          (!a.isLocal && b.isLocal) ||
          (!a.isRemote && b.isRemote)) {
        toUpdate.add(b.updateFromDb(a));
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
          a.isLocal = false;
          toUpdate.add(a);
        }
      } else {
        toRemove.add(a);
      }
    },
    onlySecond: (Asset b) => toAdd.add(b),
  );
  return Triple(toAdd, toUpdate, toRemove);
}

/// returns a tuple (toDelete toUpdate) when assets are to be deleted
Pair<List<int>, List<Asset>> _handleAssetRemoval(
  List<Asset> deleteCandidates,
  List<Asset> existing, {
  bool? remote,
}) {
  if (deleteCandidates.isEmpty) {
    return const Pair([], []);
  }
  deleteCandidates.sort(Asset.compareById);
  existing.sort(Asset.compareById);
  final triple = _diffAssets(
    existing,
    deleteCandidates,
    compare: Asset.compareById,
    remote: remote,
  );
  return Pair(triple.third.map((e) => e.id).toList(), triple.second);
}

/// returns `true` if the albums differ on the surface
Future<bool> _hasAssetPathEntityChanged(AssetPathEntity a, Album b) async {
  return a.name != b.name ||
      a.lastModified != b.modifiedAt ||
      await a.assetCountAsync != b.assetCount;
}

/// returns `true` if the albums differ on the surface
bool _hasAlbumResponseDtoChanged(AlbumResponseDto dto, Album a) {
  return dto.assetCount != a.assetCount ||
      dto.albumName != a.name ||
      dto.albumThumbnailAssetId != a.thumbnail.value?.remoteId ||
      dto.shared != a.shared ||
      dto.sharedUsers.length != a.sharedUsers.length ||
      DateTime.parse(dto.updatedAt).toUtc() != a.modifiedAt.toUtc();
}
