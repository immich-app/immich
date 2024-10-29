import 'dart:async';
import 'dart:collection';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/interfaces/album_api.interface.dart';
import 'package:immich_mobile/interfaces/album_media.interface.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/backup.interface.dart';
import 'package:immich_mobile/models/albums/album_add_asset_response.model.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/repositories/album.repository.dart';
import 'package:immich_mobile/repositories/album_api.repository.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/services/entity.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:logging/logging.dart';

final albumServiceProvider = Provider(
  (ref) => AlbumService(
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(entityServiceProvider),
    ref.watch(albumRepositoryProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(backupRepositoryProvider),
    ref.watch(albumMediaRepositoryProvider),
    ref.watch(albumApiRepositoryProvider),
  ),
);

class AlbumService {
  final UserService _userService;
  final SyncService _syncService;
  final EntityService _entityService;
  final IAlbumRepository _albumRepository;
  final IAssetRepository _assetRepository;
  final IBackupRepository _backupAlbumRepository;
  final IAlbumMediaRepository _albumMediaRepository;
  final IAlbumApiRepository _albumApiRepository;
  final Logger _log = Logger('AlbumService');
  Completer<bool> _localCompleter = Completer()..complete(false);
  Completer<bool> _remoteCompleter = Completer()..complete(false);

  AlbumService(
    this._userService,
    this._syncService,
    this._entityService,
    this._albumRepository,
    this._assetRepository,
    this._backupAlbumRepository,
    this._albumMediaRepository,
    this._albumApiRepository,
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
  Future<bool> refreshRemoteAlbums() async {
    if (!_remoteCompleter.isCompleted) {
      // guard against concurrent calls
      return _remoteCompleter.future;
    }
    _remoteCompleter = Completer();
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      await _userService.refreshUsers();
      final List<Album> sharedAlbum =
          await _albumApiRepository.getAll(shared: true);

      final List<Album> ownedAlbum =
          await _albumApiRepository.getAll(shared: null);

      final albums = HashSet<Album>(
        equals: (a, b) => a.remoteId == b.remoteId,
        hashCode: (a) => a.remoteId.hashCode,
      );

      albums.addAll(sharedAlbum);
      albums.addAll(ownedAlbum);

      changes = await _syncService.syncRemoteAlbumsToDb(albums.toList());
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
    final Album album = await _albumApiRepository.create(
      albumName,
      assetIds: assets.map((asset) => asset.remoteId!),
      sharedUserIds: sharedUsers.map((user) => user.id),
    );
    await _entityService.fillAlbumWithDatabaseEntities(album);
    return _albumRepository.create(album);
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

  Future<AlbumAddAssetsResponse?> addAssets(
    Album album,
    Iterable<Asset> assets,
  ) async {
    try {
      final result = await _albumApiRepository.addAssets(
        album.remoteId!,
        assets.map((asset) => asset.remoteId!),
      );

      final List<Asset> addedAssets = result.added
          .map((id) => assets.firstWhere((asset) => asset.remoteId == id))
          .toList();

      await _updateAssets(album.id, add: addedAssets);

      return AlbumAddAssetsResponse(
        alreadyInAlbum: result.duplicates,
        successfullyAdded: addedAssets.length,
      );
    } catch (e) {
      debugPrint("Error addAssets  ${e.toString()}");
    }
    return null;
  }

  Future<void> _updateAssets(
    int albumId, {
    List<Asset> add = const [],
    List<Asset> remove = const [],
  }) =>
      _albumRepository.transaction(() async {
        final album = await _albumRepository.get(albumId);
        if (album == null) return;
        await _albumRepository.addAssets(album, add);
        await _albumRepository.removeAssets(album, remove);
        await _albumRepository.recalculateMetadata(album);
        await _albumRepository.update(album);
      });

  Future<bool> setActivityStatus(Album album, bool enabled) async {
    try {
      final updatedAlbum = await _albumApiRepository.update(
        album.remoteId!,
        activityEnabled: enabled,
      );
      album.activityEnabled = updatedAlbum.activityEnabled;
      await _albumRepository.update(album);
      return true;
    } catch (e) {
      debugPrint("Error setActivityEnabled  ${e.toString()}");
    }
    return false;
  }

  Future<bool> deleteAlbum(Album album) async {
    try {
      final userId = Store.get(StoreKey.currentUser).isarId;
      if (album.owner.value?.isarId == userId) {
        await _albumApiRepository.delete(album.remoteId!);
      }
      if (album.shared) {
        final foreignAssets =
            await _assetRepository.getByAlbum(album, notOwnedBy: [userId]);
        await _albumRepository.delete(album.id);

        final List<Album> albums = await _albumRepository.getAll(shared: true);
        final List<Asset> existing = [];
        for (Album album in albums) {
          existing.addAll(
            await _assetRepository.getByAlbum(album, notOwnedBy: [userId]),
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
      await _albumApiRepository.removeUser(album.remoteId!, userId: "me");
      return true;
    } catch (e) {
      debugPrint("Error leaveAlbum ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAsset(
    Album album,
    Iterable<Asset> assets,
  ) async {
    try {
      final result = await _albumApiRepository.removeAssets(
        album.remoteId!,
        assets.map((asset) => asset.remoteId!),
      );
      final toRemove = result.removed
          .map((id) => assets.firstWhere((asset) => asset.remoteId == id));
      await _updateAssets(album.id, remove: toRemove.toList());
      return true;
    } catch (e) {
      debugPrint("Error removeAssetFromAlbum ${e.toString()}");
    }
    return false;
  }

  Future<bool> removeUser(
    Album album,
    User user,
  ) async {
    try {
      await _albumApiRepository.removeUser(
        album.remoteId!,
        userId: user.id,
      );

      album.sharedUsers.remove(user);
      await _albumRepository.removeUsers(album, [user]);
      final a = await _albumRepository.get(album.id);
      // trigger watcher
      await _albumRepository.update(a!);

      return true;
    } catch (error) {
      debugPrint("Error removeUser  ${error.toString()}");
      return false;
    }
  }

  Future<bool> addUsers(
    Album album,
    List<String> userIds,
  ) async {
    try {
      final updatedAlbum =
          await _albumApiRepository.addUsers(album.remoteId!, userIds);

      album.sharedUsers.addAll(updatedAlbum.remoteUsers);
      album.shared = true;

      await _albumRepository.addUsers(album, album.sharedUsers.toList());
      await _albumRepository.update(album);

      return true;
    } catch (error) {
      debugPrint("Error addUsers ${error.toString()}");
    }
    return false;
  }

  Future<bool> changeTitleAlbum(
    Album album,
    String newAlbumTitle,
  ) async {
    try {
      final updatedAlbum = await _albumApiRepository.update(
        album.remoteId!,
        name: newAlbumTitle,
      );

      album.name = updatedAlbum.name;
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
        await _albumApiRepository.addAssets(album.remoteId!, assetIds);
      }
    }
  }

  Future<List<Album>> getAll() async {
    return _albumRepository.getAll(remote: true);
  }

  Future<List<Album>> search(
    String searchTerm,
    QuickFilterMode filterMode,
  ) async {
    return _albumRepository.search(searchTerm, filterMode);
  }
}
