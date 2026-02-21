// ignore_for_file: constant_identifier_names

import 'dart:async';
import 'dart:convert';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_migration.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

enum SyncMigrationTask {
  v20260128_ResetExifV1, // EXIF table has incorrect width and height information.
  v20260128_CopyExifWidthHeightToAsset, // Asset table has incorrect width and height for video ratio calculations.
  v20260128_ResetAssetV1, // Asset v2.5.0 has width and height information that were edited assets.
}

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final SyncApiRepository _syncApiRepository;
  final SyncStreamRepository _syncStreamRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final SyncMigrationRepository _syncMigrationRepository;
  final ApiService _api;
  final bool Function()? _cancelChecker;

  SyncStreamService({
    required SyncApiRepository syncApiRepository,
    required SyncStreamRepository syncStreamRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required DriftTrashedLocalAssetRepository trashedLocalAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
    required SyncMigrationRepository syncMigrationRepository,
    required ApiService api,
    bool Function()? cancelChecker,
  }) : _syncApiRepository = syncApiRepository,
       _syncStreamRepository = syncStreamRepository,
       _localAssetRepository = localAssetRepository,
       _trashedLocalAssetRepository = trashedLocalAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository,
       _syncMigrationRepository = syncMigrationRepository,
       _api = api,
       _cancelChecker = cancelChecker;

  bool get isCancelled => _cancelChecker?.call() ?? false;

  Future<bool> sync() async {
    _logger.info("Remote sync request for user");
    final serverVersion = await _api.serverInfoApi.getServerVersion();
    if (serverVersion == null) {
      _logger.severe("Cannot perform sync: unable to determine server version");
      return false;
    }

    final serverSemVer = SemVer(major: serverVersion.major, minor: serverVersion.minor, patch: serverVersion.patch_);

    final value = Store.get(StoreKey.syncMigrationStatus, "[]");
    final migrations = (jsonDecode(value) as List).cast<String>();
    int previousLength = migrations.length;
    await _runPreSyncTasks(migrations, serverSemVer);

    if (migrations.length != previousLength) {
      _logger.info("Updated pre-sync migration status: $migrations");
      await Store.put(StoreKey.syncMigrationStatus, jsonEncode(migrations));
    }

    // Start the sync stream and handle events
    bool shouldReset = false;
    await _syncApiRepository.streamChanges(
      _handleEvents,
      serverVersion: serverSemVer,
      onReset: () => shouldReset = true,
    );
    if (shouldReset) {
      _logger.info("Resetting sync state as requested by server");
      await _syncApiRepository.streamChanges(_handleEvents, serverVersion: serverSemVer);
    }

    previousLength = migrations.length;
    await _runPostSyncTasks(migrations);

    if (migrations.length != previousLength) {
      _logger.info("Updated pre-sync migration status: $migrations");
      await Store.put(StoreKey.syncMigrationStatus, jsonEncode(migrations));
    }

    return true;
  }

  Future<void> _runPreSyncTasks(List<String> migrations, SemVer semVer) async {
    if (!migrations.contains(SyncMigrationTask.v20260128_ResetExifV1.name)) {
      _logger.info("Running pre-sync task: v20260128_ResetExifV1");
      await _syncApiRepository.deleteSyncAck([
        SyncEntityType.assetExifV1,
        SyncEntityType.partnerAssetExifV1,
        SyncEntityType.albumAssetExifCreateV1,
        SyncEntityType.albumAssetExifUpdateV1,
      ]);
      migrations.add(SyncMigrationTask.v20260128_ResetExifV1.name);
    }

    if (!migrations.contains(SyncMigrationTask.v20260128_ResetAssetV1.name) &&
        semVer >= const SemVer(major: 2, minor: 5, patch: 0)) {
      _logger.info("Running pre-sync task: v20260128_ResetAssetV1");
      await _syncApiRepository.deleteSyncAck([
        SyncEntityType.assetV1,
        SyncEntityType.partnerAssetV1,
        SyncEntityType.albumAssetCreateV1,
        SyncEntityType.albumAssetUpdateV1,
      ]);

      migrations.add(SyncMigrationTask.v20260128_ResetAssetV1.name);

      if (!migrations.contains(SyncMigrationTask.v20260128_CopyExifWidthHeightToAsset.name)) {
        migrations.add(SyncMigrationTask.v20260128_CopyExifWidthHeightToAsset.name);
      }
    }
  }

  Future<void> _runPostSyncTasks(List<String> migrations) async {
    if (!migrations.contains(SyncMigrationTask.v20260128_CopyExifWidthHeightToAsset.name)) {
      _logger.info("Running post-sync task: v20260128_CopyExifWidthHeightToAsset");
      await _syncMigrationRepository.v20260128CopyExifWidthHeightToAsset();
      migrations.add(SyncMigrationTask.v20260128_CopyExifWidthHeightToAsset.name);
    }
  }

  Future<void> _handleEvents(List<SyncEvent> events, Function() abort, Function() reset) async {
    List<SyncEvent> items = [];
    for (final event in events) {
      if (isCancelled) {
        _logger.warning("Sync stream cancelled");
        abort();
        return;
      }

      if (event.type != items.firstOrNull?.type) {
        await _processBatch(items);
      }

      if (event.type == SyncEntityType.syncResetV1) {
        reset();
      }

      items.add(event);
    }

    await _processBatch(items);
  }

  Future<void> _processBatch(List<SyncEvent> batch) async {
    if (batch.isEmpty) {
      return;
    }

    final type = batch.first.type;
    await _handleSyncData(type, batch.map((e) => e.data));
    await _syncApiRepository.ack([batch.last.ack]);
    batch.clear();
  }

  Future<void> _handleSyncData(SyncEntityType type, Iterable<Object> data) async {
    _logger.fine("Processing sync data for $type of length ${data.length}");
    switch (type) {
      case SyncEntityType.authUserV1:
        return _syncStreamRepository.updateAuthUsersV1(data.cast());
      case SyncEntityType.userV1:
        return _syncStreamRepository.updateUsersV1(data.cast());
      case SyncEntityType.userDeleteV1:
        return _syncStreamRepository.deleteUsersV1(data.cast());
      case SyncEntityType.partnerV1:
        return _syncStreamRepository.updatePartnerV1(data.cast());
      case SyncEntityType.partnerDeleteV1:
        return _syncStreamRepository.deletePartnerV1(data.cast());
      case SyncEntityType.assetV1:
        final remoteSyncAssets = data.cast<SyncAssetV1>();
        await _syncStreamRepository.updateAssetsV1(remoteSyncAssets);
        if (CurrentPlatform.isAndroid && Store.get(StoreKey.manageLocalMediaAndroid, false)) {
          final hasPermission = await _localFilesManager.hasManageMediaPermission();
          if (hasPermission) {
            await _handleRemoteTrashed(remoteSyncAssets.where((e) => e.deletedAt != null).map((e) => e.checksum));
            await _applyRemoteRestoreToLocal();
          } else {
            _logger.warning("sync Trashed Assets cannot proceed because MANAGE_MEDIA permission is missing");
          }
        }
        return;
      case SyncEntityType.assetDeleteV1:
        return _syncStreamRepository.deleteAssetsV1(data.cast());
      case SyncEntityType.assetExifV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast());
      case SyncEntityType.assetMetadataV1:
        return _syncStreamRepository.updateAssetsMetadataV1(data.cast());
      case SyncEntityType.assetMetadataDeleteV1:
        return _syncStreamRepository.deleteAssetsMetadataV1(data.cast());
      case SyncEntityType.partnerAssetV1:
        return _syncStreamRepository.updateAssetsV1(data.cast(), debugLabel: 'partner');
      case SyncEntityType.partnerAssetBackfillV1:
        return _syncStreamRepository.updateAssetsV1(data.cast(), debugLabel: 'partner backfill');
      case SyncEntityType.partnerAssetDeleteV1:
        return _syncStreamRepository.deleteAssetsV1(data.cast(), debugLabel: "partner");
      case SyncEntityType.partnerAssetExifV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast(), debugLabel: 'partner');
      case SyncEntityType.partnerAssetExifBackfillV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast(), debugLabel: 'partner backfill');
      case SyncEntityType.albumV1:
        return _syncStreamRepository.updateAlbumsV1(data.cast());
      case SyncEntityType.albumDeleteV1:
        return _syncStreamRepository.deleteAlbumsV1(data.cast());
      case SyncEntityType.albumUserV1:
        return _syncStreamRepository.updateAlbumUsersV1(data.cast());
      case SyncEntityType.albumUserBackfillV1:
        return _syncStreamRepository.updateAlbumUsersV1(data.cast(), debugLabel: 'backfill');
      case SyncEntityType.albumUserDeleteV1:
        return _syncStreamRepository.deleteAlbumUsersV1(data.cast());
      case SyncEntityType.albumAssetCreateV1:
        return _syncStreamRepository.updateAssetsV1(data.cast(), debugLabel: 'album asset create');
      case SyncEntityType.albumAssetUpdateV1:
        return _syncStreamRepository.updateAssetsV1(data.cast(), debugLabel: 'album asset update');
      case SyncEntityType.albumAssetBackfillV1:
        return _syncStreamRepository.updateAssetsV1(data.cast(), debugLabel: 'album asset backfill');
      case SyncEntityType.albumAssetExifCreateV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast(), debugLabel: 'album asset exif create');
      case SyncEntityType.albumAssetExifUpdateV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast(), debugLabel: 'album asset exif update');
      case SyncEntityType.albumAssetExifBackfillV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast(), debugLabel: 'album asset exif backfill');
      case SyncEntityType.albumToAssetV1:
        return _syncStreamRepository.updateAlbumToAssetsV1(data.cast());
      case SyncEntityType.albumToAssetBackfillV1:
        return _syncStreamRepository.updateAlbumToAssetsV1(data.cast(), debugLabel: 'backfill');
      case SyncEntityType.albumToAssetDeleteV1:
        return _syncStreamRepository.deleteAlbumToAssetsV1(data.cast());
      // No-op. SyncAckV1 entities are checkpoints in the sync stream
      // to acknowledge that the client has processed all the backfill events
      case SyncEntityType.syncAckV1:
        return;
      // SyncCompleteV1 is used to signal the completion of the sync process. Cleanup stale assets and signal completion
      case SyncEntityType.syncCompleteV1:
        return;
      // return _syncStreamRepository.pruneAssets();
      // Request to reset the client state. Clear everything related to remote entities
      case SyncEntityType.syncResetV1:
        return _syncStreamRepository.reset();
      case SyncEntityType.memoryV1:
        return _syncStreamRepository.updateMemoriesV1(data.cast());
      case SyncEntityType.memoryDeleteV1:
        return _syncStreamRepository.deleteMemoriesV1(data.cast());
      case SyncEntityType.memoryToAssetV1:
        return _syncStreamRepository.updateMemoryAssetsV1(data.cast());
      case SyncEntityType.memoryToAssetDeleteV1:
        return _syncStreamRepository.deleteMemoryAssetsV1(data.cast());
      case SyncEntityType.stackV1:
        return _syncStreamRepository.updateStacksV1(data.cast());
      case SyncEntityType.stackDeleteV1:
        return _syncStreamRepository.deleteStacksV1(data.cast());
      case SyncEntityType.partnerStackV1:
        return _syncStreamRepository.updateStacksV1(data.cast(), debugLabel: 'partner');
      case SyncEntityType.partnerStackBackfillV1:
        return _syncStreamRepository.updateStacksV1(data.cast(), debugLabel: 'partner backfill');
      case SyncEntityType.partnerStackDeleteV1:
        return _syncStreamRepository.deleteStacksV1(data.cast(), debugLabel: 'partner');
      case SyncEntityType.userMetadataV1:
        return _syncStreamRepository.updateUserMetadatasV1(data.cast());
      case SyncEntityType.userMetadataDeleteV1:
        return _syncStreamRepository.deleteUserMetadatasV1(data.cast());
      case SyncEntityType.personV1:
        return _syncStreamRepository.updatePeopleV1(data.cast());
      case SyncEntityType.personDeleteV1:
        return _syncStreamRepository.deletePeopleV1(data.cast());
      case SyncEntityType.assetFaceV1:
        return _syncStreamRepository.updateAssetFacesV1(data.cast());
      case SyncEntityType.assetFaceV2:
        return _syncStreamRepository.updateAssetFacesV2(data.cast());
      case SyncEntityType.assetFaceDeleteV1:
        return _syncStreamRepository.deleteAssetFacesV1(data.cast());
      default:
        _logger.warning("Unknown sync data type: $type");
    }
  }

  Future<void> handleWsAssetUploadReadyV1Batch(List<dynamic> batchData) async {
    if (batchData.isEmpty) return;

    _logger.info('Processing batch of ${batchData.length} AssetUploadReadyV1 events');

    final List<SyncAssetV1> assets = [];
    final List<SyncAssetExifV1> exifs = [];

    try {
      for (final data in batchData) {
        if (data is! Map<String, dynamic>) {
          continue;
        }

        final payload = data;
        final assetData = payload['asset'];
        final exifData = payload['exif'];

        if (assetData == null || exifData == null) {
          continue;
        }

        final asset = SyncAssetV1.fromJson(assetData);
        final exif = SyncAssetExifV1.fromJson(exifData);

        if (asset != null && exif != null) {
          assets.add(asset);
          exifs.add(exif);
        }
      }

      if (assets.isNotEmpty && exifs.isNotEmpty) {
        await _syncStreamRepository.updateAssetsV1(assets, debugLabel: 'websocket-batch');
        await _syncStreamRepository.updateAssetsExifV1(exifs, debugLabel: 'websocket-batch');
        _logger.info('Successfully processed ${assets.length} assets in batch');
      }
    } catch (error, stackTrace) {
      _logger.severe("Error processing AssetUploadReadyV1 websocket batch events", error, stackTrace);
    }
  }

  Future<void> handleWsAssetEditReadyV1Batch(List<dynamic> batchData) async {
    if (batchData.isEmpty) return;

    _logger.info('Processing batch of ${batchData.length} AssetEditReadyV1 events');

    final List<SyncAssetV1> assets = [];

    try {
      for (final data in batchData) {
        if (data is! Map<String, dynamic>) {
          continue;
        }

        final payload = data;
        final assetData = payload['asset'];

        if (assetData == null) {
          continue;
        }

        final asset = SyncAssetV1.fromJson(assetData);

        if (asset != null) {
          assets.add(asset);
        }
      }

      if (assets.isNotEmpty) {
        await _syncStreamRepository.updateAssetsV1(assets, debugLabel: 'websocket-edit');
        _logger.info('Successfully processed ${assets.length} edited assets');
      }
    } catch (error, stackTrace) {
      _logger.severe("Error processing AssetEditReadyV1 websocket batch events", error, stackTrace);
    }
  }

  Future<void> _handleRemoteTrashed(Iterable<String> checksums) async {
    if (checksums.isEmpty) {
      return Future.value();
    } else {
      final localAssetsToTrash = await _localAssetRepository.getAssetsFromBackupAlbums(checksums);
      if (localAssetsToTrash.isNotEmpty) {
        final mediaUrls = await Future.wait(
          localAssetsToTrash.values
              .expand((e) => e)
              .map((localAsset) => _storageRepository.getAssetEntityForAsset(localAsset).then((e) => e?.getMediaUrl())),
        );
        _logger.info("Moving to trash ${mediaUrls.join(", ")} assets");
        final result = await _localFilesManager.moveToTrash(mediaUrls.nonNulls.toList());
        if (result) {
          await _trashedLocalAssetRepository.trashLocalAsset(localAssetsToTrash);
        }
      } else {
        _logger.info("No assets found in backup-enabled albums for assets: $checksums");
      }
    }
  }

  Future<void> _applyRemoteRestoreToLocal() async {
    final assetsToRestore = await _trashedLocalAssetRepository.getToRestore();
    if (assetsToRestore.isNotEmpty) {
      final restoredIds = await _localFilesManager.restoreAssetsFromTrash(assetsToRestore);
      await _trashedLocalAssetRepository.applyRestoredAssets(restoredIds);
    } else {
      _logger.info("No remote assets found for restoration");
    }
  }
}
