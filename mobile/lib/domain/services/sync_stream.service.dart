import 'dart:async';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final SyncApiRepository _syncApiRepository;
  final SyncStreamRepository _syncStreamRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final LocalFilesManagerRepository _localFilesManager;
  final StorageRepository _storageRepository;
  final bool Function()? _cancelChecker;

  SyncStreamService({
    required SyncApiRepository syncApiRepository,
    required SyncStreamRepository syncStreamRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required DriftTrashedLocalAssetRepository trashedLocalAssetRepository,
    required LocalFilesManagerRepository localFilesManager,
    required StorageRepository storageRepository,
    bool Function()? cancelChecker,
  }) : _syncApiRepository = syncApiRepository,
       _syncStreamRepository = syncStreamRepository,
       _localAssetRepository = localAssetRepository,
       _trashedLocalAssetRepository = trashedLocalAssetRepository,
       _localFilesManager = localFilesManager,
       _storageRepository = storageRepository,
       _cancelChecker = cancelChecker;

  bool get isCancelled => _cancelChecker?.call() ?? false;

  Future<bool> sync() async {
    _logger.info("Remote sync request for user");
    // Start the sync stream and handle events
    bool shouldReset = false;
    await _syncApiRepository.streamChanges(_handleEvents, onReset: () => shouldReset = true);
    if (shouldReset) {
      _logger.info("Resetting sync state as requested by server");
      await _syncApiRepository.streamChanges(_handleEvents);
    }
    return true;
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
