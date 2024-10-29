import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/interfaces/backup.interface.dart';
import 'package:immich_mobile/interfaces/etag.interface.dart';
import 'package:immich_mobile/interfaces/exif_info.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/models/backup/backup_candidate.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
import 'package:immich_mobile/repositories/etag.repository.dart';
import 'package:immich_mobile/repositories/exif_info.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/backup.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:logging/logging.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(exifInfoRepositoryProvider),
    ref.watch(userRepositoryProvider),
    ref.watch(etagRepositoryProvider),
    ref.watch(backupRepositoryProvider),
    ref.watch(apiServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(albumServiceProvider),
  ),
);

class AssetService {
  final IAssetApiRepository _assetApiRepository;
  final IAssetRepository _assetRepository;
  final IExifInfoRepository _exifInfoRepository;
  final IUserRepository _userRepository;
  final IETagRepository _etagRepository;
  final IBackupRepository _backupRepository;
  final ApiService _apiService;
  final SyncService _syncService;
  final UserService _userService;
  final BackupService _backupService;
  final AlbumService _albumService;
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
    this._userService,
    this._backupService,
    this._albumService,
  );

  /// Checks the server for updated assets and updates the local database if
  /// required. Returns `true` if there were any changes.
  Future<bool> refreshRemoteAssets() async {
    final syncedUserIds = await _etagRepository.getAllIds();
    final List<User> syncedUsers = syncedUserIds.isEmpty
        ? []
        : await _userRepository.getByIds(syncedUserIds);
    final Stopwatch sw = Stopwatch()..start();
    final bool changes = await _syncService.syncRemoteAssetsToDb(
      users: syncedUsers,
      getChangedAssets: _getRemoteAssetChanges,
      loadAssets: _getRemoteAssets,
      refreshUsers: _userService.getUsersFromServer,
    );
    debugPrint("refreshRemoteAssets full took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  /// Returns `(null, null)` if changes are invalid -> requires full sync
  Future<(List<Asset>? toUpsert, List<String>? toDelete)>
      _getRemoteAssetChanges(List<User> users, DateTime since) async {
    final dto = AssetDeltaSyncDto(
      updatedAfter: since,
      userIds: users.map((e) => e.id).toList(),
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
  Future<List<Asset>?> _getRemoteAssets(User user, DateTime until) async {
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
          userId: user.id,
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

  Future<bool> deleteAssets(
    Iterable<Asset> deleteAssets, {
    bool? force = false,
  }) async {
    try {
      final List<String> payload = [];

      for (final asset in deleteAssets) {
        payload.add(asset.remoteId!);
      }

      await _apiService.assetsApi.deleteAssets(
        AssetBulkDeleteDto(
          ids: payload,
          force: force,
        ),
      );
      return true;
    } catch (error, stack) {
      log.severe("Error while deleting assets", error, stack);
    }
    return false;
  }

  /// Loads the exif information from the database. If there is none, loads
  /// the exif info from the server (remote assets only)
  Future<Asset> loadExif(Asset a) async {
    a.exifInfo ??= await _exifInfoRepository.get(a.id);
    // fileSize is always filled on the server but not set on client
    if (a.exifInfo?.fileSize == null) {
      if (a.isRemote) {
        final dto = await _apiService.assetsApi.getAssetInfo(a.remoteId!);
        if (dto != null && dto.exifInfo != null) {
          final newExif = Asset.remote(dto).exifInfo!.copyWith(id: a.id);
          a.exifInfo = newExif;
          if (newExif != a.exifInfo) {
            if (a.isInDb) {
              _assetRepository.transaction(() => _assetRepository.update(a));
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
        element.exifInfo?.dateTimeOriginal = DateTime.parse(updatedDt);
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
        element.exifInfo?.lat = location.latitude;
        element.exifInfo?.long = location.longitude;
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
      final owner = await _userRepository.me();
      final remoteAssets = await _assetRepository.getAll(
        ownerId: owner.isarId,
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
    final localExifId = asset.exifInfo?.id;

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
        exifInfo.description = description;
        await _exifInfoRepository.update(exifInfo);
      }
    }
  }

  Future<String> getDescription(Asset asset) async {
    final localExifId = asset.exifInfo?.id;

    // Guard [remoteAssetId] and [localExifId] null
    if (localExifId == null) {
      return "";
    }

    final exifInfo = await _exifInfoRepository.get(localExifId);

    return exifInfo?.description ?? "";
  }
}
