import 'dart:async';
import 'dart:collection';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/albums/album_add_asset_response.model.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/services/backup.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
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
  final Logger _log = Logger('AlbumService');
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
      _log.info("refreshDeviceAlbums is already in progress");
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
        final numLocal = await _db.albums.where().localIdIsNotNull().count();
        if (numLocal > 0) {
          _syncService.removeAllLocalAlbumsAndAssets();
        }
        return false;
      }
      final List<AssetPathEntity> onDevice =
          await PhotoManager.getAssetPathList(
        hasAll: true,
        filterOption: FilterOptionGroup(containsPathModified: true),
      );
      _log.info("Found ${onDevice.length} device albums");
      Set<String>? excludedAssets;
      if (excludedIds.isNotEmpty) {
        if (Platform.isIOS) {
          // iOS and Android device album working principle differ significantly
          // on iOS, an asset can be in multiple albums
          // on Android, an asset can only be in exactly one album (folder!) at the same time
          // thus, on Android, excluding an album can be done by ignoring that album
          // however, on iOS, it it necessary to load the assets from all excluded
          // albums and check every asset from any selected album against the set
          // of excluded assets
          excludedAssets = await _loadExcludedAssetIds(onDevice, excludedIds);
          _log.info("Found ${excludedAssets.length} assets to exclude");
        }
        // remove all excluded albums
        onDevice.removeWhere((e) => excludedIds.contains(e.id));
        _log.info(
          "Ignoring ${excludedIds.length} excluded albums resulting in ${onDevice.length} device albums",
        );
      }
      final hasAll = selectedIds
          .map((id) => onDevice.firstWhereOrNull((a) => a.id == id))
          .whereNotNull()
          .any((a) => a.isAll);
      if (hasAll) {
        if (Platform.isAndroid) {
          // remove the virtual "Recent" album and keep and individual albums
          // on Android, the virtual "Recent" `lastModified` value is always null
          onDevice.removeWhere((e) => e.isAll);
          _log.info("'Recents' is selected, keeping all individual albums");
        }
      } else {
        // keep only the explicitly selected albums
        onDevice.removeWhere((e) => !selectedIds.contains(e.id));
        _log.info("'Recents' is not selected, keeping only selected albums");
      }
      changes =
          await _syncService.syncLocalAlbumAssetsToDb(onDevice, excludedAssets);
      _log.info("Syncing completed. Changes: $changes");
    } finally {
      _localCompleter.complete(changes);
    }
    debugPrint("refreshDeviceAlbums took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  Future<Set<String>> _loadExcludedAssetIds(
    List<AssetPathEntity> albums,
    List<String> excludedAlbumIds,
  ) async {
    final Set<String> result = HashSet<String>();
    for (AssetPathEntity a in albums) {
      if (excludedAlbumIds.contains(a.id)) {
        final List<AssetEntity> assets =
            await a.getAssetListRange(start: 0, end: 0x7fffffffffffffff);
        result.addAll(assets.map((e) => e.id));
      }
    }
    return result;
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

  Future<AlbumAddAssetsResponse?> addAdditionalAssetToAlbum(
    Iterable<Asset> assets,
    Album album,
  ) async {
    try {
      var response = await _apiService.albumApi.addAssetsToAlbum(
        album.remoteId!,
        BulkIdsDto(ids: assets.map((asset) => asset.remoteId!).toList()),
      );

      if (response != null) {
        List<Asset> successAssets = [];
        List<String> duplicatedAssets = [];

        for (final result in response) {
          if (result.success) {
            successAssets
                .add(assets.firstWhere((asset) => asset.remoteId == result.id));
          } else if (!result.success &&
              result.error == BulkIdResponseDtoErrorEnum.duplicate) {
            duplicatedAssets.add(result.id);
          }
        }

        await _updateAssets(album.id, add: successAssets);

        return AlbumAddAssetsResponse(
          alreadyInAlbum: duplicatedAssets,
          successfullyAdded: successAssets.length,
        );
      }
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
    }
    return null;
  }

  Future<void> _updateAssets(
    int albumId, {
    Iterable<Asset> add = const [],
    Iterable<Asset> remove = const [],
  }) {
    return _db.writeTxn(() async {
      final album = await _db.albums.get(albumId);
      if (album == null) return;
      await album.assets.update(link: add, unlink: remove);
      album.startDate =
          await album.assets.filter().fileCreatedAtProperty().min();
      album.endDate = await album.assets.filter().fileCreatedAtProperty().max();
      album.lastModifiedAssetTimestamp =
          await album.assets.filter().updatedAtProperty().max();
      await _db.albums.put(album);
    });
  }

  Future<bool> addAdditionalUserToAlbum(
    List<String> sharedUserIds,
    Album album,
  ) async {
    try {
      final List<AlbumUserAddDto> albumUsers = sharedUserIds
          .map((userId) => AlbumUserAddDto(userId: userId))
          .toList();

      final result = await _apiService.albumApi.addUsersToAlbum(
        album.remoteId!,
        AddUsersDto(albumUsers: albumUsers),
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

  Future<bool> setActivityEnabled(Album album, bool enabled) async {
    try {
      final result = await _apiService.albumApi.updateAlbumInfo(
        album.remoteId!,
        UpdateAlbumDto(isActivityEnabled: enabled),
      );
      if (result != null) {
        album.activityEnabled = enabled;
        await _db.writeTxn(() => _db.albums.put(album));
        return true;
      }
    } catch (e) {
      debugPrint("Error setActivityEnabled  ${e.toString()}");
    }
    return false;
  }

  Future<bool> deleteAlbum(Album album) async {
    try {
      final userId = Store.get(StoreKey.currentUser).isarId;
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
      debugPrint("Error leaveAlbum ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    Album album,
    Iterable<Asset> assets,
  ) async {
    try {
      final response = await _apiService.albumApi.removeAssetFromAlbum(
        album.remoteId!,
        BulkIdsDto(
          ids: assets.map((asset) => asset.remoteId!).toList(),
        ),
      );
      if (response != null) {
        final toRemove = response.every((e) => e.success)
            ? assets
            : response
                .where((e) => e.success)
                .map((e) => assets.firstWhere((a) => a.remoteId == e.id));
        await _updateAssets(album.id, remove: toRemove);
        return true;
      }
    } catch (e) {
      debugPrint("Error removeAssetFromAlbum ${e.toString()}");
    }
    return false;
  }

  Future<bool> removeUserFromAlbum(
    Album album,
    User user,
  ) async {
    try {
      await _apiService.albumApi.removeUserFromAlbum(
        album.remoteId!,
        user.id,
      );

      album.sharedUsers.remove(user);
      await _db.writeTxn(() async {
        await album.sharedUsers.update(unlink: [user]);
        final a = await _db.albums.get(album.id);
        // trigger watcher
        await _db.albums.put(a!);
      });

      return true;
    } catch (e) {
      debugPrint("Error removeUserFromAlbum  ${e.toString()}");
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
      debugPrint("Error changeTitleAlbum  ${e.toString()}");
      return false;
    }
  }
}
