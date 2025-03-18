import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final ISyncApiRepository _syncApiRepository;

  SyncStreamService(this._syncApiRepository);

  StreamSubscription? _userSyncSubscription;
  StreamSubscription? _assetSyncSubscription;
  StreamSubscription? _exifSyncSubscription;

  bool _isUserSyncing = false;
  bool _isAssetSyncing = false;
  bool _isExifSyncing = false;

  void syncUsers() {
    if (_isUserSyncing) {
      return;
    }

    _isUserSyncing = true;
    final Map<String, String> acks = {};
    _userSyncSubscription = _syncApiRepository.watchUserSyncEvent().listen(
      (events) async {
        for (final event in events) {
          if (event.data is SyncUserV1) {
            // final data = event.data as SyncUserV1;

            acks['SyncUserV1'] = event.ack;
          }

          if (event.data is SyncUserDeleteV1) {
            // final data = event.data as SyncUserDeleteV1;

            acks['SyncUserDeleteV1'] = event.ack;
          }
        }

        await _syncApiRepository.ack(acks.values.toList());
      },
      onDone: () {
        _isUserSyncing = false;
      },
      onError: (_) {
        _isUserSyncing = false;
      },
    );
  }

  void syncAssets() {
    if (_isAssetSyncing) {
      debugPrint("Asset syncing already in progress");
      return;
    }
    _isAssetSyncing = true;
    int eventCount = 0;
    final Map<String, String> acks = {};

    _assetSyncSubscription = _syncApiRepository.watchAssetSyncEvent().listen(
      (events) async {
        eventCount += events.length;
        debugPrint("Asset events: $eventCount");
        for (final event in events) {
          if (event.data is SyncAssetV1) {
            // final data = event.data as SyncAssetV1;
            acks['SyncAssetV1'] = event.ack;
          }

          if (event.data is SyncAssetDeleteV1) {
            // final data = event.data as SyncAssetDeleteV1;
            acks['SyncAssetDeleteV1'] = event.ack;
          }
        }

        await _syncApiRepository.ack(acks.values.toList());
      },
      onDone: () {
        _isAssetSyncing = false;
      },
      onError: (_) {
        _isAssetSyncing = false;
      },
    );
  }

  void syncExif() {
    if (_isExifSyncing) {
      debugPrint("EXIF syncing already in progress");
      return;
    }

    _isExifSyncing = true;
    int eventCount = 0;
    final Map<String, String> acks = {};

    _exifSyncSubscription = _syncApiRepository.watchExifSyncEvent().listen(
      (events) async {
        eventCount += events.length;
        debugPrint("exif events: $eventCount");
        for (final event in events) {
          if (event.data is SyncAssetExifV1) {
            // final data = event.data as SyncAssetExifV1;

            acks['SyncAssetExifV1'] = event.ack;
          }
        }

        await _syncApiRepository.ack(acks.values.toList());
      },
      onDone: () {
        _isExifSyncing = false;
      },
      onError: (_) {
        _isExifSyncing = false;
      },
    );
  }

  Future<void> dispose() async {
    await _userSyncSubscription?.cancel();
    await _assetSyncSubscription?.cancel();
    await _exifSyncSubscription?.cancel();
  }
}
