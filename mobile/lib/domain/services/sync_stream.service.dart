// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final ISyncApiRepository _syncApiRepository;
  final ISyncStreamRepository _syncStreamRepository;
  final bool Function()? _cancelChecker;

  SyncStreamService({
    required ISyncApiRepository syncApiRepository,
    required ISyncStreamRepository syncStreamRepository,
    bool Function()? cancelChecker,
  })  : _syncApiRepository = syncApiRepository,
        _syncStreamRepository = syncStreamRepository,
        _cancelChecker = cancelChecker;

  Future<bool> _handleSyncData(
    SyncEntityType type,
    // ignore: avoid-dynamic
    Iterable<dynamic> data,
  ) async {
    _logger.fine("Processing sync data for $type of length ${data.length}");
    // ignore: prefer-switch-expression
    switch (type) {
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
        return _syncStreamRepository.updatePartnerAssetsV1(data.cast());
      case SyncEntityType.partnerAssetDeleteV1:
        return _syncStreamRepository.deletePartnerAssetsV1(data.cast());
      case SyncEntityType.partnerAssetExifV1:
        return _syncStreamRepository.updatePartnerAssetsExifV1(data.cast());
      default:
        _logger.warning("Unknown sync data type: $type");
        return false;
    }
  }

  bool get isCancelled => _cancelChecker?.call() ?? false;

  Future<bool> _processBatch(List<SyncEvent> batch) async {
    if (batch.isEmpty) {
      return true;
    }

    final type = batch.first.type;
    if (await _handleSyncData(type, batch.map((e) => e.data))) {
      await _syncApiRepository.ack([batch.last.ack]);
      return true;
    }

    _logger.warning("Failed to process sync data for $type");
    return false;
  }

  Future<void> _handleEvents(List<SyncEvent> events, Function() abort) async {
    bool shouldAbort = false;
    try {
      List<SyncEvent> items = [];
      for (final event in events) {
        if (isCancelled) {
          _logger.warning("Sync stream cancelled");
          shouldAbort = true;
          break;
        }

        if (event.type == items.firstOrNull?.type) {
          items.add(event);
          continue;
        }

        if (!await _processBatch(items)) {
          _logger
              .warning("Failed to process sync data for ${items.first.type}");
          shouldAbort = true;
          break;
        }

        items = [event];
      }

      if (!shouldAbort && !await _processBatch(items)) {
        _logger.warning(
          "Failed to process sync data for ${items.firstOrNull?.type}",
        );
        shouldAbort = true;
      }
    } catch (e, s) {
      _logger.severe("Error processing sync events", e, s);
      shouldAbort = true;
    }
    if (shouldAbort) {
      abort();
    }
  }

  Future<void> sync() => _syncApiRepository.streamChanges(_handleEvents);
}
