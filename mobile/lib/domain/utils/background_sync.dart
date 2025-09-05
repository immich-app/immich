import 'dart:async';

import 'package:immich_mobile/domain/utils/sync_linked_album.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

typedef SyncCallback = void Function();
typedef SyncErrorCallback = void Function(String error);

class BackgroundSyncManager {
  final SyncCallback? onRemoteSyncStart;
  final SyncCallback? onRemoteSyncComplete;
  final SyncErrorCallback? onRemoteSyncError;

  final SyncCallback? onLocalSyncStart;
  final SyncCallback? onLocalSyncComplete;
  final SyncErrorCallback? onLocalSyncError;

  final SyncCallback? onHashingStart;
  final SyncCallback? onHashingComplete;
  final SyncErrorCallback? onHashingError;

  Cancelable<void>? _syncTask;
  Cancelable<void>? _syncWebsocketTask;
  Cancelable<void>? _deviceAlbumSyncTask;
  Cancelable<void>? _linkedAlbumSyncTask;
  Cancelable<void>? _hashTask;

  BackgroundSyncManager({
    this.onRemoteSyncStart,
    this.onRemoteSyncComplete,
    this.onRemoteSyncError,
    this.onLocalSyncStart,
    this.onLocalSyncComplete,
    this.onLocalSyncError,
    this.onHashingStart,
    this.onHashingComplete,
    this.onHashingError,
  });

  Future<void> cancel() async {
    final futures = <Future>[];

    if (_syncTask != null) {
      futures.add(_syncTask!.future);
    }
    _syncTask?.cancel();
    _syncTask = null;

    if (_syncWebsocketTask != null) {
      futures.add(_syncWebsocketTask!.future);
    }
    _syncWebsocketTask?.cancel();
    _syncWebsocketTask = null;

    if (_linkedAlbumSyncTask != null) {
      futures.add(_linkedAlbumSyncTask!.future);
    }
    _linkedAlbumSyncTask?.cancel();
    _linkedAlbumSyncTask = null;

    try {
      await Future.wait(futures);
    } on CanceledError {
      // Ignore cancellation errors
    }
  }

  Future<void> cancelLocal() async {
    final futures = <Future>[];

    if (_hashTask != null) {
      futures.add(_hashTask!.future);
    }
    _hashTask?.cancel();
    _hashTask = null;

    if (_deviceAlbumSyncTask != null) {
      futures.add(_deviceAlbumSyncTask!.future);
    }
    _deviceAlbumSyncTask?.cancel();
    _deviceAlbumSyncTask = null;

    try {
      await Future.wait(futures);
    } on CanceledError {
      // Ignore cancellation errors
    }
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> syncLocal({bool full = false}) {
    if (_deviceAlbumSyncTask != null) {
      return _deviceAlbumSyncTask!.future;
    }

    onLocalSyncStart?.call();

    // We use a ternary operator to avoid [_deviceAlbumSyncTask] from being
    // captured by the closure passed to [runInIsolateGentle].
    _deviceAlbumSyncTask = full
        ? runInIsolateGentle(computation: (ref) => ref.read(localSyncServiceProvider).sync(full: true))
        : runInIsolateGentle(computation: (ref) => ref.read(localSyncServiceProvider).sync(full: false));

    return _deviceAlbumSyncTask!
        .whenComplete(() {
          _deviceAlbumSyncTask = null;
          onLocalSyncComplete?.call();
        })
        .catchError((error) {
          onLocalSyncError?.call(error.toString());
          _deviceAlbumSyncTask = null;
        });
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> hashAssets() {
    if (_hashTask != null) {
      return _hashTask!.future;
    }

    onHashingStart?.call();

    _hashTask = runInIsolateGentle(computation: (ref) => ref.read(hashServiceProvider).hashAssets());

    return _hashTask!
        .whenComplete(() {
          onHashingComplete?.call();
          _hashTask = null;
        })
        .catchError((error) {
          onHashingError?.call(error.toString());
          _hashTask = null;
        });
  }

  Future<void> syncRemote() {
    if (_syncTask != null) {
      return _syncTask!.future;
    }

    onRemoteSyncStart?.call();

    _syncTask = runInIsolateGentle(computation: (ref) => ref.read(syncStreamServiceProvider).sync());
    return _syncTask!
        .whenComplete(() {
          onRemoteSyncComplete?.call();
          _syncTask = null;
        })
        .catchError((error) {
          onRemoteSyncError?.call(error.toString());
          _syncTask = null;
        });
  }

  Future<void> syncWebsocketBatch(List<dynamic> batchData) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }
    _syncWebsocketTask = _handleWsAssetUploadReadyV1Batch(batchData);
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    });
  }

  Future<void> syncLinkedAlbum() {
    if (_linkedAlbumSyncTask != null) {
      return _linkedAlbumSyncTask!.future;
    }

    _linkedAlbumSyncTask = runInIsolateGentle(computation: syncLinkedAlbumsIsolated);
    return _linkedAlbumSyncTask!.whenComplete(() {
      _linkedAlbumSyncTask = null;
    });
  }
}

Cancelable<void> _handleWsAssetUploadReadyV1Batch(List<dynamic> batchData) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetUploadReadyV1Batch(batchData),
);
