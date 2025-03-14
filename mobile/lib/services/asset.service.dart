import 'dart:async';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/interfaces/backup_album.interface.dart';
import 'package:immich_mobile/interfaces/etag.interface.dart';
import 'package:immich_mobile/models/backup/backup_candidate.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/exif.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart'
    hide userServiceProvider;
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
import 'package:immich_mobile/repositories/etag.repository.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/backup.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:logging/logging.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(exifRepositoryProvider),
    ref.watch(userRepositoryProvider),
    ref.watch(etagRepositoryProvider),
    ref.watch(backupAlbumRepositoryProvider),
    ref.watch(apiServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(storeServiceProvider),
    ref.watch(assetMediaRepositoryProvider),
  ),
);

class AssetService {
  final IAssetApiRepository _assetApiRepository;
  final IAssetRepository _assetRepository;
  final IExifInfoRepository _exifInfoRepository;
  final IUserRepository _userRepository;
  final IETagRepository _etagRepository;
  final IBackupAlbumRepository _backupRepository;
  final ApiService _apiService;
  final SyncService _syncService;
  final BackupService _backupService;
  final AlbumService _albumService;
  final StoreService _storeService;
  final IAssetMediaRepository _assetMediaRepository;
  final log = Logger('AssetService');

  AssetService(
    this._assetApiRepository,
    this._assetRepository,
    this._exifInfoRepository,
    this._userRepository,
    this._etagRepository,
    this._backupRepository,
    this._apiService,
    this._syncService,
    this._backupService,
    this._albumService,
    this._storeService,
    this._assetMediaRepository,
  );

  /// Checks the server for updated assets and updates the local database if
  /// required. Returns `true` if there were any changes.
  Future<bool> refreshRemoteAssets() async {
    final syncedUserIds = await _etagRepository.getAllIds();
    final List<UserDto> syncedUsers = syncedUserIds.isEmpty
        ? []
        : (await _userRepository.getByUserIds(syncedUserIds)).nonNulls.toList();
    final Stopwatch sw = Stopwatch()..start();
    final bool changes = await _syncService.syncRemoteAssetsToDb(
      users: syncedUsers,
      getChangedAssets: _getRemoteAssetChanges,
      loadAssets: _getRemoteAssets,
    );
    debugPrint("refreshRemoteAssets full took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  /// Returns `(null, null)` if changes are invalid -> requires full sync
  Future<(List<Asset>? toUpsert, List<String>? toDelete)>
      _getRemoteAssetChanges(List<UserDto> users, DateTime since) async {
    final dto = AssetDeltaSyncDto(
      updatedAfter: since,
      userIds: users.map((e) => e.uid).toList(),
    );
    final changes = await _apiService.syncApi.getDeltaSync(dto);
    return changes == null || changes.needsFullSync
        ? (null, null)
        : (changes.upserted.map(Asset.remote).toList(), changes.deleted);
  }

  /// Returns the list of people of the given asset id.
  // If the server is not reachable `null` is returned.
  Future<List<PersonWithFacesResponseDto>?> getRemotePeopleOfAsset(
    String remoteId,
  ) async {
    try {
      final AssetResponseDto? dto =
          await _apiService.assetsApi.getAssetInfo(remoteId);

      return dto?.people;
    } catch (error, stack) {
      log.severe(
        'Error while getting remote asset info: ${error.toString()}',
        error,
        stack,
      );

      return null;
    }
  }

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<Asset>?> _getRemoteAssets(UserDto user, DateTime until) async {
    const int chunkSize = 10000;
    try {
      final List<Asset> allAssets = [];
      String? lastId;
      // will break on error or once all assets are loaded
      while (true) {
        final dto = AssetFullSyncDto(
          limit: chunkSize,
          updatedUntil: until,
          lastId: lastId,
          userId: user.uid,
        );
        log.fine("Requesting $chunkSize assets from $lastId");
        final List<AssetResponseDto>? assets =
            await _apiService.syncApi.getFullSyncForUser(dto);
        if (assets == null) return null;
        log.fine(
          "Received ${assets.length} assets from ${assets.firstOrNull?.id} to ${assets.lastOrNull?.id}",
        );
        allAssets.addAll(assets.map(Asset.remote));
        if (assets.length != chunkSize) break;
        lastId = assets.last.id;
      }
      return allAssets;
    } catch (error, stack) {
      log.severe('Error while getting remote assets', error, stack);
      return null;
    }
  }

  /// Loads the exif information from the database. If there is none, loads
  /// the exif info from the server (remote assets only)
  Future<Asset> loadExif(Asset a) async {
    a.exifInfo ??= (await _exifInfoRepository.get(a.id));
    // fileSize is always filled on the server but not set on client
    if (a.exifInfo?.fileSize == null) {
      if (a.isRemote) {
        final dto = await _apiService.assetsApi.getAssetInfo(a.remoteId!);
        if (dto != null && dto.exifInfo != null) {
          final newExif = Asset.remote(dto).exifInfo!.copyWith(assetId: a.id);
          a.exifInfo = newExif;
          if (newExif != a.exifInfo) {
            if (a.isInDb) {
              await _assetRepository
                  .transaction(() => _assetRepository.update(a));
            } else {
              debugPrint("[loadExif] parameter Asset is not from DB!");
            }
          }
        }
      } else {
        // TODO implement local exif info parsing
      }
    }
    return a;
  }

  Future<void> updateAssets(
    List<Asset> assets,
    UpdateAssetDto updateAssetDto,
  ) async {
    return await _apiService.assetsApi.updateAssets(
      AssetBulkUpdateDto(
        ids: assets.map((e) => e.remoteId!).toList(),
        dateTimeOriginal: updateAssetDto.dateTimeOriginal,
        isFavorite: updateAssetDto.isFavorite,
        isArchived: updateAssetDto.isArchived,
        latitude: updateAssetDto.latitude,
        longitude: updateAssetDto.longitude,
      ),
    );
  }

  Future<List<Asset>> changeFavoriteStatus(
    List<Asset> assets,
    bool isFavorite,
  ) async {
    try {
      await updateAssets(assets, UpdateAssetDto(isFavorite: isFavorite));

      for (var element in assets) {
        element.isFavorite = isFavorite;
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing favorite status", error, stack);
      return [];
    }
  }

  Future<List<Asset>> changeArchiveStatus(
    List<Asset> assets,
    bool isArchived,
  ) async {
    try {
      await updateAssets(assets, UpdateAssetDto(isArchived: isArchived));

      for (var element in assets) {
        element.isArchived = isArchived;
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing archive status", error, stack);
      return [];
    }
  }

  Future<List<Asset>?> changeDateTime(
    List<Asset> assets,
    String updatedDt,
  ) async {
    try {
      await updateAssets(
        assets,
        UpdateAssetDto(dateTimeOriginal: updatedDt),
      );

      for (var element in assets) {
        element.fileCreatedAt = DateTime.parse(updatedDt);
        element.exifInfo ??= element.exifInfo
            ?.copyWith(dateTimeOriginal: DateTime.parse(updatedDt));
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing date/time status", error, stack);
      return Future.value(null);
    }
  }

  Future<List<Asset>?> changeLocation(
    List<Asset> assets,
    LatLng location,
  ) async {
    try {
      await updateAssets(
        assets,
        UpdateAssetDto(
          latitude: location.latitude,
          longitude: location.longitude,
        ),
      );

      for (var element in assets) {
        element.exifInfo ??= element.exifInfo?.copyWith(
          latitude: location.latitude,
          longitude: location.longitude,
        );
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing location status", error, stack);
      return Future.value(null);
    }
  }

  Future<void> syncUploadedAssetToAlbums() async {
    try {
      final selectedAlbums =
          await _backupRepository.getAllBySelection(BackupSelection.select);
      final excludedAlbums =
          await _backupRepository.getAllBySelection(BackupSelection.exclude);

      final candidates = await _backupService.buildUploadCandidates(
        selectedAlbums,
        excludedAlbums,
        useTimeFilter: false,
      );

      await refreshRemoteAssets();
      final owner = _storeService.get(StoreKey.currentUser);
      final remoteAssets = await _assetRepository.getAll(
        ownerId: owner.id,
        state: AssetState.merged,
      );

      /// Map<AlbumName, [AssetId]>
      Map<String, List<String>> assetToAlbums = {};

      for (BackupCandidate candidate in candidates) {
        final asset = remoteAssets.firstWhereOrNull(
          (a) => a.localId == candidate.asset.localId,
        );

        if (asset != null) {
          for (final albumName in candidate.albumNames) {
            assetToAlbums.putIfAbsent(albumName, () => []).add(asset.remoteId!);
          }
        }
      }

      // Upload assets to albums
      for (final entry in assetToAlbums.entries) {
        final albumName = entry.key;
        final assetIds = entry.value;

        await _albumService.syncUploadAlbums([albumName], assetIds);
      }
    } catch (error, stack) {
      log.severe("Error while syncing uploaded asset to albums", error, stack);
    }
  }

  Future<void> setDescription(
    Asset asset,
    String newDescription,
  ) async {
    final remoteAssetId = asset.remoteId;
    final localExifId = asset.exifInfo?.assetId;

    // Guard [remoteAssetId] and [localExifId] null
    if (remoteAssetId == null || localExifId == null) {
      return;
    }

    final result = await _assetApiRepository.update(
      remoteAssetId,
      description: newDescription,
    );

    final description = result.exifInfo?.description;

    if (description != null) {
      var exifInfo = await _exifInfoRepository.get(localExifId);

      if (exifInfo != null) {
        await _exifInfoRepository
            .update(exifInfo.copyWith(description: description));
      }
    }
  }

  Future<String> getDescription(Asset asset) async {
    final localExifId = asset.exifInfo?.assetId;

    // Guard [remoteAssetId] and [localExifId] null
    if (localExifId == null) {
      return "";
    }

    final exifInfo = await _exifInfoRepository.get(localExifId);

    return exifInfo?.description ?? "";
  }

  Future<double> getAspectRatio(Asset asset) async {
    // platform_manager always returns 0 for orientation on iOS, so only prefer it on Android
    if (asset.isLocal && Platform.isAndroid) {
      await asset.localAsync;
    } else if (asset.isRemote) {
      asset = await loadExif(asset);
    } else if (asset.isLocal) {
      await asset.localAsync;
    }

    final aspectRatio = asset.aspectRatio;
    if (aspectRatio != null) {
      return aspectRatio;
    }

    final width = asset.width;
    final height = asset.height;
    if (width != null && height != null) {
      // we don't know the orientation, so assume it's normal
      return width / height;
    }

    return 1.0;
  }

  Future<List<Asset>> getStackAssets(String stackId) {
    return _assetRepository.getStackAssets(stackId);
  }

  Future<void> clearTable() {
    return _assetRepository.clearTable();
  }

  /// Delete assets from local file system and unreference from the database
  Future<void> deleteLocalAssets(Iterable<Asset> assets) async {
    // Delete files from local gallery
    final candidates = assets.where((asset) => asset.isLocal);

    final deletedIds = await _assetMediaRepository
        .deleteAll(candidates.map((asset) => asset.localId!).toList());

    // Modify local database by removing the reference to the local assets
    if (deletedIds.isNotEmpty) {
      // Delete records from local database
      final isarIds = assets
          .where((asset) => asset.storage == AssetState.local)
          .map((asset) => asset.id)
          .toList();
      await _assetRepository.deleteByIds(isarIds);

      // Modify Merged asset to be remote only
      final updatedAssets = assets
          .where((asset) => asset.storage == AssetState.merged)
          .map((asset) {
        asset.localId = null;
        return asset;
      }).toList();

      await _assetRepository.updateAll(updatedAssets);
    }
  }

  /// Delete assets from the server and unreference from the database
  Future<void> deleteRemoteAssets(
    Iterable<Asset> assets, {
    bool shouldDeletePermanently = false,
  }) async {
    final candidates = assets.where((a) => a.isRemote);
    if (candidates.isEmpty) {
      return;
    }

    await _apiService.assetsApi.deleteAssets(
      AssetBulkDeleteDto(
        ids: candidates.map((a) => a.remoteId!).toList(),
        force: shouldDeletePermanently,
      ),
    );

    /// Update asset info bassed on the deletion type.
    final payload = shouldDeletePermanently
        ? assets
            .where((asset) => asset.storage == AssetState.merged)
            .map((asset) {
            asset.remoteId = null;
            return asset;
          })
        : assets.where((asset) => asset.isRemote).map((asset) {
            asset.isTrashed = true;
            return asset;
          });

    await _assetRepository.transaction(() async {
      await _assetRepository.updateAll(payload.toList());

      if (shouldDeletePermanently) {
        final remoteAssetIds = assets
            .where((asset) => asset.storage == AssetState.remote)
            .map((asset) => asset.id)
            .toList();
        await _assetRepository.deleteByIds(remoteAssetIds);
      }
    });
  }

  /// Delete assets on both local file system and the server.
  /// Unreference from the database.
  Future<void> deleteAssets(
    Iterable<Asset> assets, {
    bool shouldDeletePermanently = false,
  }) async {
    final hasLocal = assets.any((asset) => asset.isLocal);
    final hasRemote = assets.any((asset) => asset.isRemote);

    if (hasLocal) {
      await deleteLocalAssets(assets);
    }

    if (hasRemote) {
      await deleteRemoteAssets(
        assets,
        shouldDeletePermanently: shouldDeletePermanently,
      );
    }
  }

  Stream<Asset?> watchAsset(int id, {bool fireImmediately = false}) {
    return _assetRepository.watchAsset(id, fireImmediately: fireImmediately);
  }

  Future<List<Asset>> getRecentlyAddedAssets() {
    final me = _storeService.get(StoreKey.currentUser);
    return _assetRepository.getRecentlyAddedAssets(me.id);
  }

  Future<List<Asset>> getMotionAssets() {
    final me = _storeService.get(StoreKey.currentUser);
    return _assetRepository.getMotionAssets(me.id);
  }
}
