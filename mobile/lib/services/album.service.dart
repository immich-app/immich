import 'dart:async';
import 'dart:collection';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/interfaces/album_media.interface.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/backup.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/models/albums/album_add_asset_response.model.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/album.repository.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final albumServiceProvider = Provider(
  (ref) => AlbumService(
    ref.watch(apiServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(albumRepositoryProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(userRepositoryProvider),
    ref.watch(backupRepositoryProvider),
    ref.watch(albumMediaRepositoryProvider),
  ),
);

class AlbumService {
  final ApiService _apiService;
  final UserService _userService;
  final SyncService _syncService;
  final IAlbumRepository _albumRepository;
  final IAssetRepository _assetRepository;
  final IUserRepository _userRepository;
  final IBackupRepository _backupAlbumRepository;
  final IAlbumMediaRepository _albumMediaRepository;
  final Logger _log = Logger('AlbumService');
  Completer<bool> _localCompleter = Completer()..complete(false);
  Completer<bool> _remoteCompleter = Completer()..complete(false);

  AlbumService(
    this._apiService,
    this._userService,
    this._syncService,
    this._albumRepository,
    this._assetRepository,
    this._userRepository,
    this._backupAlbumRepository,
    this._albumMediaRepository,
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
      final List<String> excludedIds = await _backupAlbumRepository
          .getIdsBySelection(BackupSelection.exclude);
      final List<String> selectedIds = await _backupAlbumRepository
          .getIdsBySelection(BackupSelection.select);
      if (selectedIds.isEmpty) {
        final numLocal = await _albumRepository.count(local: true);
        if (numLocal > 0) {
          _syncService.removeAllLocalAlbumsAndAssets();
        }
        return false;
      }
      final List<Album> onDevice = await _albumMediaRepository.getAll();
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
        onDevice.removeWhere((e) => excludedIds.contains(e.localId));
        _log.info(
          "Ignoring ${excludedIds.length} excluded albums resulting in ${onDevice.length} device albums",
        );
      }
      final hasAll = selectedIds
          .map(
            (id) => onDevice.firstWhereOrNull((album) => album.localId == id),
          )
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
        onDevice.removeWhere((e) => !selectedIds.contains(e.localId));
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
    List<Album> albums,
    List<String> excludedAlbumIds,
  ) async {
    final Set<String> result = HashSet<String>();
    for (Album album in albums) {
      if (excludedAlbumIds.contains(album.localId)) {
        final assetIds =
            await _albumMediaRepository.getAssetIds(album.localId!);
        result.addAll(assetIds);
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
      final List<AlbumResponseDto>? serverAlbums = await _apiService.albumsApi
          .getAllAlbums(shared: isShared ? true : null);
      if (serverAlbums == null) {
        return false;
      }
      changes = await _syncService.syncRemoteAlbumsToDb(
        serverAlbums,
        isShared: isShared,
        loadDetails: (dto) async => dto.assetCount == dto.assets.length
            ? dto
            : (await _apiService.albumsApi.getAlbumInfo(dto.id)) ?? dto,
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
      AlbumResponseDto? remote = await _apiService.albumsApi.createAlbum(
        CreateAlbumDto(
          albumName: albumName,
          assetIds: assets.map((asset) => asset.remoteId!).toList(),
          albumUsers: sharedUsers
              .map(
                (e) => AlbumUserCreateDto(
                  userId: e.id,
                  role: AlbumUserRole.editor,
                ),
              )
              .toList(),
        ),
      );
      if (remote != null) {
        final Album album = await Album.remote(remote);
        await _albumRepository.create(album);
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

      if (null == await _albumRepository.getByName(proposedName)) {
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
      var response = await _apiService.albumsApi.addAssetsToAlbum(
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
    List<Asset> add = const [],
    List<Asset> remove = const [],
  }) async {
    final album = await _albumRepository.getById(albumId);
    if (album == null) return;
    await _albumRepository.addAssets(album, add);
    await _albumRepository.removeAssets(album, remove);
    await _albumRepository.recalculateMetadata(album);
    await _albumRepository.update(album);
  }

  Future<bool> addAdditionalUserToAlbum(
    List<String> sharedUserIds,
    Album album,
  ) async {
    try {
      final List<AlbumUserAddDto> albumUsers = sharedUserIds
          .map((userId) => AlbumUserAddDto(userId: userId))
          .toList();

      final result = await _apiService.albumsApi.addUsersToAlbum(
        album.remoteId!,
        AddUsersDto(albumUsers: albumUsers),
      );
      if (result != null) {
        album.sharedUsers.addAll(await _userRepository.getByIds(sharedUserIds));
        album.shared = result.shared;
        await _albumRepository.update(album);
        return true;
      }
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> setActivityEnabled(Album album, bool enabled) async {
    try {
      final result = await _apiService.albumsApi.updateAlbumInfo(
        album.remoteId!,
        UpdateAlbumDto(isActivityEnabled: enabled),
      );
      if (result != null) {
        album.activityEnabled = enabled;
        await _albumRepository.update(album);
        return true;
      }
    } catch (e) {
      debugPrint("Error setActivityEnabled  ${e.toString()}");
    }
    return false;
  }

  Future<bool> deleteAlbum(Album album) async {
    try {
      final user = Store.get(StoreKey.currentUser);
      if (album.owner.value?.isarId == user.isarId) {
        await _apiService.albumsApi.deleteAlbum(album.remoteId!);
      }
      if (album.shared) {
        final foreignAssets =
            await _assetRepository.getByAlbum(album, notOwnedBy: user);
        await _albumRepository.delete(album.id);

        final List<Album> albums = await _albumRepository.getAll(shared: true);
        final List<Asset> existing = [];
        for (Album album in albums) {
          existing.addAll(
            await _assetRepository.getByAlbum(album, notOwnedBy: user),
          );
        }
        final List<int> idsToRemove =
            _syncService.sharedAssetsToRemove(foreignAssets, existing);
        if (idsToRemove.isNotEmpty) {
          await _assetRepository.deleteById(idsToRemove);
        }
      } else {
        await _albumRepository.delete(album.id);
      }
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
    }
    return false;
  }

  Future<bool> leaveAlbum(Album album) async {
    try {
      await _apiService.albumsApi.removeUserFromAlbum(album.remoteId!, "me");
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
      final response = await _apiService.albumsApi.removeAssetFromAlbum(
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
        await _updateAssets(album.id, remove: toRemove.toList());
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
      await _apiService.albumsApi.removeUserFromAlbum(
        album.remoteId!,
        user.id,
      );

      album.sharedUsers.remove(user);
      await _albumRepository.removeUsers(album, [user]);
      final a = await _albumRepository.getById(album.id);
      // trigger watcher
      await _albumRepository.update(a!);

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
      await _apiService.albumsApi.updateAlbumInfo(
        album.remoteId!,
        UpdateAlbumDto(
          albumName: newAlbumTitle,
        ),
      );
      album.name = newAlbumTitle;
      await _albumRepository.update(album);

      return true;
    } catch (e) {
      debugPrint("Error changeTitleAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<Album?> getAlbumByName(String name, bool remoteOnly) =>
      _albumRepository.getByName(name, remote: remoteOnly ? true : null);

  ///
  /// Add the uploaded asset to the selected albums
  ///
  Future<void> syncUploadAlbums(
    List<String> albumNames,
    List<String> assetIds,
  ) async {
    for (final albumName in albumNames) {
      Album? album = await getAlbumByName(albumName, true);
      album ??= await createAlbum(albumName, []);

      if (album != null && album.remoteId != null) {
        await _apiService.albumsApi.addAssetsToAlbum(
          album.remoteId!,
          BulkIdsDto(ids: assetIds),
        );
      }
    }
  }
}
