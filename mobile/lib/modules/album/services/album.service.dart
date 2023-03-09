import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:immich_mobile/shared/services/user.service.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final albumServiceProvider = Provider(
  (ref) => AlbumService(
    ref.watch(apiServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(dbProvider),
    ref.watch(backupServiceProvider),
  ),
);

class AlbumService {
  final ApiService _apiService;
  final UserService _userService;
  final SyncService _syncService;
  final Isar _db;
  final BackupService _backupService;
  Completer<bool> _localCompleter = Completer()..complete(false);
  Completer<bool> _remoteCompleter = Completer()..complete(false);

  AlbumService(
    this._apiService,
    this._userService,
    this._syncService,
    this._db,
    this._backupService,
  );

  /// Checks all selected device albums for changes of albums and their assets
  /// Updates the local database and returns `true` if there were any changes
  Future<bool> refreshDeviceAlbums() async {
    if (!_localCompleter.isCompleted) {
      // guard against concurrent calls
      return _localCompleter.future;
    }
    _localCompleter = Completer();
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      final List<String> excludedIds =
          await _backupService.excludedAlbumsQuery().idProperty().findAll();
      final List<String> selectedIds =
          await _backupService.selectedAlbumsQuery().idProperty().findAll();
      if (selectedIds.isEmpty) {
        return false;
      }
      final List<AssetPathEntity> onDevice =
          await PhotoManager.getAssetPathList(
        hasAll: true,
        filterOption: FilterOptionGroup(containsPathModified: true),
      );
      if (excludedIds.isNotEmpty) {
        // remove all excluded albums
        onDevice.removeWhere((e) => excludedIds.contains(e.id));
      }
      final hasAll = selectedIds
          .map((id) => onDevice.firstWhereOrNull((a) => a.id == id))
          .whereNotNull()
          .any((a) => a.isAll);
      if (hasAll) {
        // remove the virtual "Recents" album and keep and individual albums
        onDevice.removeWhere((e) => e.isAll);
      } else {
        // keep only the explicitly selected albums
        onDevice.removeWhere((e) => !selectedIds.contains(e.id));
      }
      changes = await _syncService.syncLocalAlbumAssetsToDb(onDevice);
    } finally {
      _localCompleter.complete(changes);
    }
    debugPrint("refreshDeviceAlbums took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  /// Checks remote albums (owned if `isShared` is false) for changes,
  /// updates the local database and returns `true` if there were any changes
  Future<bool> refreshRemoteAlbums({required bool isShared}) async {
    if (!_remoteCompleter.isCompleted) {
      // guard against concurrent calls
      return _remoteCompleter.future;
    }
    _remoteCompleter = Completer();
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      await _userService.refreshUsers();
      final List<AlbumResponseDto>? serverAlbums = await _apiService.albumApi
          .getAllAlbums(shared: isShared ? true : null);
      if (serverAlbums == null) {
        return false;
      }
      changes = await _syncService.syncRemoteAlbumsToDb(
        serverAlbums,
        isShared: isShared,
        loadDetails: (dto) async => dto.assetCount == dto.assets.length
            ? dto
            : (await _apiService.albumApi.getAlbumInfo(dto.id)) ?? dto,
      );
    } finally {
      _remoteCompleter.complete(changes);
    }
    debugPrint("refreshRemoteAlbums took ${sw.elapsedMilliseconds}ms");
    return changes;
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
        album.shared = result.shared;
        await _db.writeTxn(() async {
          await _db.albums.put(album);
          await album.sharedUsers.save();
        });
        return true;
      }
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> deleteAlbum(Album album) async {
    try {
      final userId = Store.get<User>(StoreKey.currentUser)!.isarId;
      if (album.owner.value?.isarId == userId) {
        await _apiService.albumApi.deleteAlbum(album.remoteId!);
      }
      if (album.shared) {
        final foreignAssets =
            await album.assets.filter().not().ownerIdEqualTo(userId).findAll();
        await _db.writeTxn(() => _db.albums.delete(album.id));
        final List<Album> albums =
            await _db.albums.filter().sharedEqualTo(true).findAll();
        final List<Asset> existing = [];
        for (Album a in albums) {
          existing.addAll(
            await a.assets.filter().not().ownerIdEqualTo(userId).findAll(),
          );
        }
        final List<int> idsToRemove =
            _syncService.sharedAssetsToRemove(foreignAssets, existing);
        if (idsToRemove.isNotEmpty) {
          await _db.writeTxn(() => _db.assets.deleteAll(idsToRemove));
        }
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
