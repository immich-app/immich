import 'dart:async';

import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final SyncApiRepository _syncApiRepository;
  final SyncStreamRepository _syncStreamRepository;
  final bool Function()? _cancelChecker;

  SyncStreamService({
    required SyncApiRepository syncApiRepository,
    required SyncStreamRepository syncStreamRepository,
    bool Function()? cancelChecker,
  }) : _syncApiRepository = syncApiRepository,
       _syncStreamRepository = syncStreamRepository,
       _cancelChecker = cancelChecker;

  bool get isCancelled => _cancelChecker?.call() ?? false;

  Future<void> sync() async {
    _logger.info("Remote sync request for user");
    // Start the sync stream and handle events
    bool shouldReset = false;
    await _syncApiRepository.streamChanges(_handleEvents, onReset: () => shouldReset = true);
    if (shouldReset) {
      await _syncApiRepository.streamChanges(_handleEvents);
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
        return _syncStreamRepository.updateAssetsV1(data.cast());
      case SyncEntityType.assetDeleteV1:
        return _syncStreamRepository.deleteAssetsV1(data.cast());
      case SyncEntityType.assetExifV1:
        return _syncStreamRepository.updateAssetsExifV1(data.cast());
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
      // No-op. SyncCompleteV1 is used to signal the completion of the sync process
      case SyncEntityType.syncCompleteV1:
        return;
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
}
