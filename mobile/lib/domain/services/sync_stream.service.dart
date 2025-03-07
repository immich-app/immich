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
    _userSyncSubscription = _syncApiRepository.watchUserSyncEvent().listen(
      (events) async {
        for (final event in events) {
          if (event.data is SyncUserV1) {
            final data = event.data as SyncUserV1;
            debugPrint("User Update: $data");

            // await _syncApiRepository.ack(event.ack);
          }

          if (event.data is SyncUserDeleteV1) {
            final data = event.data as SyncUserDeleteV1;

            debugPrint("User delete: $data");
            // await _syncApiRepository.ack(event.ack);
          }
        }
        await _syncApiRepository.ack(events.last.ack);
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

    _assetSyncSubscription = _syncApiRepository.watchAssetSyncEvent().listen(
      (events) async {
        eventCount += events.length;
        debugPrint("Asset events: $eventCount");
        for (final event in events) {
          if (event.data is SyncAssetV1) {
            // final data = event.data as SyncAssetV1;
            // await _syncApiRepository.ack(event.ack);
          }

          if (event.data is SyncAssetDeleteV1) {
            // final data = event.data as SyncAssetDeleteV1;

            // debugPrint("Asset delete: $data");
            // await _syncApiRepository.ack(event.ack);
          }
        }
        await _syncApiRepository.ack(events.last.ack);
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

    _exifSyncSubscription = _syncApiRepository.watchExifSyncEvent().listen(
      (events) async {
        eventCount += events.length;
        debugPrint("exif events: $eventCount");
        for (final event in events) {
          if (event.data is SyncAssetExifV1) {
            // final data = event.data as SyncAssetExifV1;

            // await _syncApiRepository.ack(event.ack);
          }
        }
        await _syncApiRepository.ack(events.last.ack);
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
