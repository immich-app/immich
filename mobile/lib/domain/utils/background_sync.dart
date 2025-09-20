import 'dart:async';

import 'package:immich_mobile/domain/utils/background_lock.dart';
import 'package:immich_mobile/domain/utils/sync_linked_album.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:logging/logging.dart';
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

  final Logger _log = Logger("BackgroundSyncManager");

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
  Future<void> syncLocal({bool full = false}) async {
    if (_deviceAlbumSyncTask != null) {
      return _deviceAlbumSyncTask!.future;
    }

    onLocalSyncStart?.call();
    if (!await acquireLock(BackgroundLock.localSync, timeout: const Duration(seconds: 20))) {
      _log.warning("Failed to acquire local sync lock");
      onLocalSyncError?.call("Failed to acquire local sync lock");
      return;
    }
    _log.info("Acquired local sync lock");

    // We use a ternary operator to avoid [_deviceAlbumSyncTask] from being
    // captured by the closure passed to [runInIsolateGentle].
    _deviceAlbumSyncTask = full
        ? runInIsolateGentle(
            computation: (ref) => ref.read(localSyncServiceProvider).sync(full: true),
            debugLabel: 'local-sync-full-true',
          )
        : runInIsolateGentle(
            computation: (ref) => ref.read(localSyncServiceProvider).sync(full: false),
            debugLabel: 'local-sync-full-false',
          );

    return _deviceAlbumSyncTask!
        .whenComplete(() {
          _deviceAlbumSyncTask = null;
          onLocalSyncComplete?.call();
          _log.info("Released local sync lock");
          releaseLock(BackgroundLock.localSync);
        })
        .catchError((error) {
          onLocalSyncError?.call(error.toString());
          _deviceAlbumSyncTask = null;
          _log.info("Released local sync lock");
          releaseLock(BackgroundLock.localSync);
        });
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> hashAssets() async {
    if (_hashTask != null) {
      return _hashTask!.future;
    }

    onHashingStart?.call();
    if (!await acquireLock(BackgroundLock.hash, timeout: const Duration(seconds: 20))) {
      _log.warning("Failed to acquire hashing lock");
      onHashingError?.call("Failed to acquire hashing lock");
      return;
    }
    _log.info("Acquired hashing lock");

    _hashTask = runInIsolateGentle(
      computation: (ref) => ref.read(hashServiceProvider).hashAssets(),
      debugLabel: 'hash-assets',
    );

    return _hashTask!
        .whenComplete(() {
          onHashingComplete?.call();
          _hashTask = null;
          _log.info("Released hashing lock");
          releaseLock(BackgroundLock.hash);
        })
        .catchError((error) {
          onHashingError?.call(error.toString());
          _hashTask = null;
          _log.info("Released hashing lock");
          releaseLock(BackgroundLock.hash);
        });
  }

  Future<void> syncRemote() async {
    if (_syncTask != null) {
      return _syncTask!.future;
    }

    onRemoteSyncStart?.call();
    if (!await acquireLock(BackgroundLock.remoteSync, timeout: const Duration(seconds: 30))) {
      _log.warning("Failed to acquire remote sync lock");
      onRemoteSyncError?.call("Failed to acquire remote sync lock");
      return;
    }
    _log.info("Acquired remote sync lock");

    _syncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
      debugLabel: 'remote-sync',
    );
    return _syncTask!
        .whenComplete(() {
          onRemoteSyncComplete?.call();
          _syncTask = null;
          _log.info("Released remote sync lock");
          releaseLock(BackgroundLock.remoteSync);
        })
        .catchError((error) {
          onRemoteSyncError?.call(error.toString());
          _syncTask = null;
          _log.info("Released remote sync lock");
          releaseLock(BackgroundLock.remoteSync);
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

  Future<void> syncLinkedAlbum() async {
    if (_linkedAlbumSyncTask != null) {
      return _linkedAlbumSyncTask!.future;
    }

    if (!await acquireLock(BackgroundLock.albumSync, timeout: const Duration(seconds: 10))) {
      _log.warning("Failed to acquire album sync lock");
      return;
    }
    _log.info("Acquired album sync lock");

    _linkedAlbumSyncTask = runInIsolateGentle(computation: syncLinkedAlbumsIsolated, debugLabel: 'linked-album-sync');
    return _linkedAlbumSyncTask!.whenComplete(() {
      _linkedAlbumSyncTask = null;
      _log.info("Released album sync lock");
      releaseLock(BackgroundLock.albumSync);
    });
  }
}

Cancelable<void> _handleWsAssetUploadReadyV1Batch(List<dynamic> batchData) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetUploadReadyV1Batch(batchData),
  debugLabel: 'websocket-batch',
);
