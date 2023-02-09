import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/asset.service.dart';
import 'package:immich_mobile/shared/services/user.service.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final albumServiceProvider = Provider(
  (ref) => AlbumService(
    ref.watch(apiServiceProvider),
    ref.watch(assetServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(dbProvider),
  ),
);

class AlbumService {
  final ApiService _apiService;
  final AssetService _assetService;
  final UserService _userService;
  final Isar _db;
  Completer<bool> _localCompleter = Completer()..complete(false);
  Completer<bool> _remoteCompleter = Completer()..complete(false);
  int? userId;

  AlbumService(
    this._apiService,
    this._assetService,
    this._userService,
    this._db,
  );

  Future<bool> refreshDeviceAlbums() async {
    if (!_localCompleter.isCompleted) {
      // guard against concurrent calls
      return _localCompleter.future;
    }
    _localCompleter = Completer();
    // wait until remote assets are fetched
    await _assetService.assetRefreshComplete;
    _assetService.albumLocalComplete = _localCompleter.future;
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      changes = await _refreshDeviceAlbums();
    } finally {
      _localCompleter.complete(changes);
    }
    debugPrint("refreshDeviceAlbums took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  Future<bool> refreshRemoteAlbums({required bool isShared}) async {
    if (!_remoteCompleter.isCompleted) {
      // guard against concurrent calls
      return _remoteCompleter.future;
    }
    _remoteCompleter = Completer();
    // wait until remote assets are fetched
    await _assetService.assetRefreshComplete;
    _assetService.albumRemoteComplete = _remoteCompleter.future;
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      changes = await _refreshRemoteAlbums(isShared: isShared);
    } finally {
      _remoteCompleter.complete(changes);
    }
    debugPrint("refreshRemoteAlbums took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  Future<bool> _refreshDeviceAlbums() async {
    final List<AssetPathEntity> onDevice = await PhotoManager.getAssetPathList(
      hasAll: false,
      filterOption: FilterOptionGroup(containsPathModified: true),
    );
    HiveBackupAlbums? infos =
        Hive.box<HiveBackupAlbums>(hiveBackupInfoBox).get(backupInfoKey);
    if (infos == null) {
      return false;
    }
    if (infos.excludedAlbumsIds.isNotEmpty) {
      onDevice.removeWhere((e) => infos.excludedAlbumsIds.contains(e.id));
    }
    if (infos.selectedAlbumIds.isNotEmpty) {
      onDevice.removeWhere((e) => !infos.selectedAlbumIds.contains(e.id));
    }
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
      ),
      onlyFirst: (AssetPathEntity ape) => _addAlbumFromDevice(ape, existing),
      onlySecond: (Album a) => _removeAlbumFromDb(a, deleteCandidates),
    );

    await _assetService.handleLocalAssetRemoval(deleteCandidates, existing);

    return anyChanges;
  }

  Future<bool> _syncAlbumInDbAndOnDevice(
    AssetPathEntity ape,
    Album album,
    List<Asset> deleteCandidates,
    List<Asset> existing, [
    bool forceRefresh = false,
  ]) async {
    if (!forceRefresh && !await _hasAssetPathEntityChanged(ape, album)) {
      return false;
    }
    if (!forceRefresh && await _tryDeviceAlbumFastSync(ape, album)) {
      return true;
    }

    // general case, e.g. some assets have been deleted
    await album.assets.load();
    final List<Asset> inDb = album.assets.toList(growable: false);
    inDb.sort((a, b) => a.localId.compareTo(b.localId));
    List<AssetEntity> onDevice =
        await ape.getAssetListRange(start: 0, end: 0x7fffffffffffffff);
    onDevice.sort((a, b) => a.id.compareTo(b.id));
    final List<AssetEntity> assetEntitiesToAdd = [];
    final List<Asset> toDelete = [];
    final List<Asset> toUpdate = [];
    await diffSortedLists(
      onDevice,
      inDb,
      compare: (AssetEntity a, Asset b) => a.id.compareTo(b.localId),
      both: (AssetEntity a, Asset b) {
        final bool hasChanged = b.updateFromAssetEntity(a);
        if (hasChanged) {
          toUpdate.add(b);
        }
        return hasChanged;
      },
      onlyFirst: (AssetEntity a) => assetEntitiesToAdd.add(a),
      onlySecond: (Asset b) => toDelete.add(b),
    );

    final result = await _assetService.linkExistingToLocal(assetEntitiesToAdd);

    deleteCandidates.addAll(toDelete);
    existing.addAll(result.first);
    album.name = ape.name;
    album.modifiedAt = ape.lastModified!;
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(result.second);
        await album.assets
            .update(link: result.first + result.second, unlink: toDelete);
        await _db.albums.put(album);
        await _db.assets.putAll(toUpdate);
      });
    } on IsarError catch (e) {
      debugPrint(e.toString());
    }

    return true;
  }

  /// fast path for common case: add new assets to album
  Future<bool> _tryDeviceAlbumFastSync(AssetPathEntity ape, Album album) async {
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
    final List<AssetEntity> newAssets = (await modified.getAssetListRange(
      start: 0,
      end: 0x7fffffffffffffff,
    ));
    if (totalOnDevice != album.assets.length + newAssets.length) {
      return false;
    }
    album.modifiedAt = ape.lastModified!;
    final result = await _assetService.linkExistingToLocal(newAssets);
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(result.second);
        await album.assets.update(link: result.first + result.second);
        await _db.albums.put(album);
      });
    } on IsarError catch (e) {
      debugPrint(e.toString());
    }

    return true;
  }

  Future<void> _addAlbumFromDevice(
    AssetPathEntity ape,
    List<Asset> existing,
  ) async {
    final Album newAlbum = Album.local(ape);
    final List<AssetEntity> deviceAssets =
        await ape.getAssetListRange(start: 0, end: 0x7fffffffffffffff);
    final result = await _assetService.linkExistingToLocal(deviceAssets);
    existing.addAll(result.first);
    newAlbum.assets.addAll(result.first);
    newAlbum.assets.addAll(result.second);
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(result.second);
        await _db.albums.store(newAlbum);
        if (newAlbum.assets.isNotEmpty) {
          newAlbum.thumbnail.value = newAlbum.assets.first;
          await newAlbum.thumbnail.save();
        }
      });
    } on IsarError catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> _removeAlbumFromDb(
    Album album,
    List<Asset> deleteCandidates,
  ) async {
    final bool ok = await _db.writeTxn(() => _db.albums.delete(album.id));
    assert(ok);
    if (album.isLocal) {
      // delete assets in DB unless they are remote or part of some other album
      deleteCandidates.addAll(album.assets.where((a) => !a.isRemote));
    } else if (album.shared) {
      // delete assets in DB unless they belong to this user or part of some other shared album
      deleteCandidates.addAll(album.assets.where((a) => a.ownerId != userId));
    }
  }

  /// Fetches the remote albums and updates the local DB if needed.
  /// Return `true` if there were any changes
  Future<bool> _refreshRemoteAlbums({required bool isShared}) async {
    await _userService.fetchAllUsers();
    final List<AlbumResponseDto>? serverAlbums =
        await _getRemoteAlbums(isShared: isShared ? true : null);
    if (serverAlbums == null) {
      return false;
    }
    serverAlbums.sort((a, b) => a.id.compareTo(b.id));
    final baseQuery = _db.albums.where().remoteIdIsNotNull().filter();
    final QueryBuilder<Album, Album, QAfterFilterCondition> query;
    final User me = Store.get(StoreKey.currentUser);
    userId = me.isarId;
    if (isShared) {
      query = baseQuery.sharedEqualTo(true);
    } else {
      query = baseQuery.owner((q) => q.isarIdEqualTo(me.isarId));
    }
    final List<Album> dbAlbums = await query.sortByRemoteId().findAll();
    final List<Asset> deleteCandidates = [];
    final List<Asset> existing = [];
    final bool changes = await diffSortedLists(
      serverAlbums,
      dbAlbums,
      compare: (AlbumResponseDto a, Album b) => a.id.compareTo(b.remoteId!),
      both: (AlbumResponseDto a, Album b) =>
          _syncAlbumInDbAndOnServer(a, b, deleteCandidates, existing),
      onlyFirst: (AlbumResponseDto a) => _addAlbumFromServer(a, existing),
      onlySecond: (Album a) => _removeAlbumFromDb(a, deleteCandidates),
    );
    if (isShared && deleteCandidates.isNotEmpty) {
      await _assetService.handleSharedAssetRemoval(deleteCandidates, existing);
    } else {
      assert(deleteCandidates.isEmpty);
    }

    return changes;
  }

  /// syncs data from server to local DB (does not support syncing changes from local to server)
  Future<bool> _syncAlbumInDbAndOnServer(
    AlbumResponseDto dto,
    Album album,
    List<Asset> deleteCandidates,
    List<Asset> existing,
  ) async {
    if (!_hasAlbumResponseDtoChanged(dto, album)) {
      return false;
    }
    if (dto.assetCount != dto.assets.length) {
      // load details (assets)
      final withDetails = await _apiService.albumApi.getAlbumInfo(dto.id);
      if (withDetails == null) {
        return false;
      }
      dto = withDetails;
    }
    dto.assets.sort((a, b) => a.id.compareTo(b.id));
    await album.assets.load();
    final assetsInDb =
        album.assets.where((e) => e.isRemote).toList(growable: false);
    assetsInDb.sort((a, b) => a.remoteId!.compareTo(b.remoteId!));
    final List<AssetResponseDto> dtosToAdd = [];
    final List<Asset> toUnlink = [];
    final List<Asset> toUpdate = [];
    await diffSortedLists(
      dto.assets,
      assetsInDb,
      compare: (AssetResponseDto a, Asset b) => a.id.compareTo(b.remoteId!),
      both: (AssetResponseDto a, Asset b) {
        if (DateTime.parse(a.updatedAt).toUtc().isAfter(b.updatedAt)) {
          toUpdate.add(b.withUpdatesFromDto(a));
          return true;
        }
        return false;
      },
      onlyFirst: (AssetResponseDto a) => dtosToAdd.add(a),
      onlySecond: (Asset a) => toUnlink.add(a),
    );

    // update shared users
    final List<User> sharedUsers = album.sharedUsers.toList(growable: false);
    sharedUsers.sort((a, b) => a.id.compareTo(b.id));
    dto.sharedUsers.sort((a, b) => a.id.compareTo(b.id));
    final List<String> userIdsToAdd = [];
    final List<User> usersToUnlink = [];
    await diffSortedLists(
      dto.sharedUsers,
      sharedUsers,
      compare: (UserResponseDto a, User b) => a.id.compareTo(b.id),
      both: (a, b) => false,
      onlyFirst: (UserResponseDto a) => userIdsToAdd.add(a.id),
      onlySecond: (User a) => usersToUnlink.add(a),
    );

    album.name = dto.albumName;
    album.shared = dto.shared;
    album.modifiedAt = DateTime.parse(dto.updatedAt).toUtc();
    if (album.thumbnail.value?.remoteId != dto.albumThumbnailAssetId) {
      album.thumbnail.value = await _db.assets
          .where()
          .remoteIdEqualTo(dto.albumThumbnailAssetId)
          .findFirst();
    }
    if (album.shared || dto.shared) {
      // shared album: put missing album assets into local DB
      _assetService.addMissingRemoteAssetsToDb(dtosToAdd);
    }
    final assetsToLink =
        await _db.assets.getAllByRemoteId(dtosToAdd.map((e) => e.id));
    final usersToLink = (await _db.users.getAllById(userIdsToAdd)).cast<User>();

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
      debugPrint(e.toString());
    }

    if (album.shared || dto.shared) {
      final foreign =
          await album.assets.filter().not().ownerIdEqualTo(userId!).findAll();
      existing.addAll(foreign);

      // delete assets in DB unless they belong to this user or part of some other shared album
      deleteCandidates.addAll(toUnlink.where((a) => a.ownerId != userId));
    }

    return true;
  }

  Future<void> _addAlbumFromServer(
    AlbumResponseDto dto,
    List<Asset> existing,
  ) async {
    if (dto.assetCount != dto.assets.length) {
      // load details (assets)
      final withDetails = await _apiService.albumApi.getAlbumInfo(dto.id);
      if (withDetails == null) {
        return;
      }
      dto = withDetails;
    }
    if (dto.shared) {
      // shared album: put missing album assets into local DB
      await _assetService.addMissingRemoteAssetsToDb(dto.assets);
    }
    final Album a = await Album.remote(dto);
    await _db.writeTxn(() => _db.albums.store(a));
    if (dto.shared) {
      existing.addAll(a.assets.where((e) => e.ownerId != userId));
    }
  }

  Future<List<AlbumResponseDto>?> _getRemoteAlbums({bool? isShared}) async {
    try {
      return await _apiService.albumApi.getAllAlbums(shared: isShared);
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<Album?> createAlbum(
    String albumName,
    Iterable<Asset> assets, [
    Iterable<User> sharedUsers = const [],
  ]) async {
    try {
      AlbumResponseDto? remote = await _apiService.albumApi.createAlbum(
        CreateAlbumDto(
          albumName: albumName,
          assetIds: assets.map((asset) => asset.remoteId!).toList(),
          sharedWithUserIds: sharedUsers.map((e) => e.id).toList(),
        ),
      );
      if (remote != null) {
        Album album = await Album.remote(remote);
        await _db.writeTxn(() => _db.albums.store(album));
        return album;
      }
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
    }
    return null;
  }

  /*
   * Creates names like Untitled, Untitled (1), Untitled (2), ...
   */
  Future<String> _getNextAlbumName() async {
    const baseName = "Untitled";
    for (int round = 0;; round++) {
      final proposedName = "$baseName${round == 0 ? "" : " ($round)"}";

      if (null ==
          await _db.albums.filter().nameEqualTo(proposedName).findFirst()) {
        return proposedName;
      }
    }
  }

  Future<Album?> createAlbumWithGeneratedName(
    Iterable<Asset> assets,
  ) async {
    return createAlbum(
      await _getNextAlbumName(),
      assets,
      [],
    );
  }

  Future<Album?> getAlbumDetail(int albumId) {
    return _db.albums.get(albumId);
  }

  Future<AddAssetsResponseDto?> addAdditionalAssetToAlbum(
    Iterable<Asset> assets,
    Album album,
  ) async {
    try {
      var result = await _apiService.albumApi.addAssetsToAlbum(
        album.remoteId!,
        AddAssetsDto(assetIds: assets.map((asset) => asset.remoteId!).toList()),
      );
      if (result != null && result.successfullyAdded > 0) {
        album.assets.addAll(assets);
        await _db.writeTxn(() => album.assets.save());
      }
      return result;
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<bool> addAdditionalUserToAlbum(
    List<String> sharedUserIds,
    Album album,
  ) async {
    try {
      final result = await _apiService.albumApi.addUsersToAlbum(
        album.remoteId!,
        AddUsersDto(sharedUserIds: sharedUserIds),
      );
      if (result != null) {
        album.sharedUsers
            .addAll((await _db.users.getAllById(sharedUserIds)).cast());
        await _db.writeTxn(() => album.sharedUsers.save());
        return true;
      }
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> deleteAlbum(Album album) async {
    try {
      if (album.owner.value?.isarId == userId) {
        await _apiService.albumApi.deleteAlbum(album.remoteId!);
      }
      if (album.shared) {
        final foreignAssets =
            await album.assets.filter().not().ownerIdEqualTo(userId!).findAll();
        await _db.writeTxn(() => _db.albums.delete(album.id));
        final List<Album> albums =
            await _db.albums.filter().sharedEqualTo(true).findAll();
        final List<Asset> existing = [];
        for (Album a in albums) {
          existing.addAll(
            await a.assets.filter().not().ownerIdEqualTo(userId!).findAll(),
          );
        }
        _assetService.handleSharedAssetRemoval(foreignAssets, existing);
      } else {
        await _db.writeTxn(() => _db.albums.delete(album.id));
      }
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> leaveAlbum(Album album) async {
    try {
      await _apiService.albumApi.removeUserFromAlbum(album.remoteId!, "me");
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    Album album,
    Iterable<Asset> assets,
  ) async {
    try {
      await _apiService.albumApi.removeAssetFromAlbum(
        album.remoteId!,
        RemoveAssetsDto(
          assetIds: assets.map((e) => e.remoteId!).toList(growable: false),
        ),
      );
      album.assets.removeAll(assets);
      await _db.writeTxn(() => album.assets.update(unlink: assets));

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> changeTitleAlbum(
    Album album,
    String newAlbumTitle,
  ) async {
    try {
      await _apiService.albumApi.updateAlbumInfo(
        album.remoteId!,
        UpdateAlbumDto(
          albumName: newAlbumTitle,
        ),
      );
      album.name = newAlbumTitle;
      await _db.writeTxn(() => _db.albums.put(album));

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }
}

Future<bool> _hasAssetPathEntityChanged(AssetPathEntity a, Album b) async {
  return a.name != b.name ||
      a.lastModified != b.modifiedAt ||
      await a.assetCountAsync != b.assets.length;
}

bool _hasAlbumResponseDtoChanged(AlbumResponseDto dto, Album a) {
  return dto.assetCount != a.assetCount ||
      dto.albumName != a.name ||
      dto.albumThumbnailAssetId != a.thumbnail.value?.remoteId ||
      dto.shared != a.shared ||
      DateTime.parse(dto.updatedAt).toUtc() != a.modifiedAt.toUtc();
}
