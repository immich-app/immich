import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/album_extensions.dart';
import 'package:immich_mobile/modules/album/models/add_asset_response.model.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
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

final albumServiceProvider = Provider(
  (ref) => AlbumService(
    ref.watch(apiServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(dbProvider),
  ),
);

class AlbumService {
  final ApiService _apiService;
  final UserService _userService;
  final SyncService _syncService;
  final Isar _db;
  Completer<bool> _remoteCompleter = Completer()..complete(false);

  AlbumService(
    this._apiService,
    this._userService,
    this._syncService,
    this._db,
  );

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

  Future<RemoteAlbum?> createAlbum(
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
        RemoteAlbum album = await RemoteAlbum.fromDto(remote, _db);
        await _db.writeTxn(() => _db.remoteAlbums.store(album));
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
          await _db.remoteAlbums
              .filter()
              .nameEqualTo(proposedName)
              .findFirst()) {
        return proposedName;
      }
    }
  }

  Future<RemoteAlbum?> createAlbumWithGeneratedName(
    Iterable<Asset> assets,
  ) async {
    return createAlbum(
      await _getNextAlbumName(),
      assets,
      [],
    );
  }

  Future<AddAssetsResponse?> addAdditionalAssetToAlbum(
    Iterable<Asset> assets,
    RemoteAlbum album,
  ) async {
    try {
      final remoteAlbum =
          await _db.remoteAlbums.where().idEqualTo(album.id).findFirst();
      if (remoteAlbum == null) {
        return null;
      }

      var response = await _apiService.albumApi.addAssetsToAlbum(
        remoteAlbum.id,
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

        await _db.writeTxn(() async {
          await remoteAlbum.assets.update(link: successAssets);
          final a = await _db.remoteAlbums.get(remoteAlbum.isarId);
          // trigger watcher
          await _db.remoteAlbums.put(a!);
        });

        return AddAssetsResponse(
          alreadyInAlbum: duplicatedAssets,
          successfullyAdded: successAssets.length,
        );
      }
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return null;
    }
    return null;
  }

  Future<bool> addAdditionalUserToAlbum(
    List<String> sharedUserIds,
    RemoteAlbum album,
  ) async {
    try {
      final result = await _apiService.albumApi.addUsersToAlbum(
        album.id,
        AddUsersDto(sharedUserIds: sharedUserIds),
      );
      if (result != null) {
        album.sharedUsers
            .addAll((await _db.users.getAllById(sharedUserIds)).cast());
        album.shared = result.shared;
        await _db.writeTxn(() async {
          await _db.remoteAlbums.put(album);
          await album.sharedUsers.save();
        });
        return true;
      }
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> setActivityEnabled(RemoteAlbum album, bool enabled) async {
    try {
      final result = await _apiService.albumApi.updateAlbumInfo(
        album.id,
        UpdateAlbumDto(isActivityEnabled: enabled),
      );
      if (result != null) {
        album.activityEnabled = enabled;
        await _db.writeTxn(() => _db.remoteAlbums.put(album));
        return true;
      }
    } catch (e) {
      debugPrint("Error setActivityEnabled  ${e.toString()}");
    }
    return false;
  }

  Future<bool> deleteAlbum(RemoteAlbum album) async {
    try {
      final userId = Store.get(StoreKey.currentUser).isarId;
      if (album.owner.value?.isarId == userId) {
        await _apiService.albumApi.deleteAlbum(album.id);
      }
      if (album.shared) {
        final foreignAssets =
            await album.assets.filter().not().ownerIdEqualTo(userId).findAll();
        await _db.writeTxn(() => _db.remoteAlbums.delete(album.isarId));
        final List<RemoteAlbum> albums =
            await _db.remoteAlbums.filter().sharedEqualTo(true).findAll();
        final List<Asset> existing = [];
        for (RemoteAlbum a in albums) {
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
        await _db.writeTxn(() => _db.remoteAlbums.delete(album.isarId));
      }
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> leaveAlbum(RemoteAlbum album) async {
    try {
      await _apiService.albumApi.removeUserFromAlbum(album.id, "me");
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    RemoteAlbum album,
    Iterable<Asset> assets,
  ) async {
    try {
      await _apiService.albumApi.removeAssetFromAlbum(
        album.id,
        BulkIdsDto(
          ids: assets.map((asset) => asset.remoteId!).toList(),
        ),
      );
      await _db.writeTxn(() async {
        await album.assets.update(unlink: assets);
        final a = await _db.remoteAlbums.get(album.isarId);
        // trigger watcher
        await _db.remoteAlbums.put(a!);
      });

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeUserFromAlbum(
    RemoteAlbum album,
    User user,
  ) async {
    try {
      await _apiService.albumApi.removeUserFromAlbum(
        album.id,
        user.id,
      );

      album.sharedUsers.remove(user);
      await _db.writeTxn(() async {
        await album.sharedUsers.update(unlink: [user]);
        final a = await _db.remoteAlbums.get(album.isarId);
        // trigger watcher
        await _db.remoteAlbums.put(a!);
      });

      return true;
    } catch (e) {
      debugPrint("Error removeUserFromAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> changeTitleAlbum(
    RemoteAlbum album,
    String newAlbumTitle,
  ) async {
    try {
      await _apiService.albumApi.updateAlbumInfo(
        album.id,
        UpdateAlbumDto(
          albumName: newAlbumTitle,
        ),
      );
      album.name = newAlbumTitle;
      await _db.writeTxn(() => _db.remoteAlbums.put(album));

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }
}
