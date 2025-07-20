import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

typedef SyncCallback = void Function();
typedef SyncErrorCallback = void Function(String error);

class BackgroundSyncManager {
  final SyncCallback? onRemoteSyncStart;
  final SyncCallback? onRemoteSyncComplete;
  final SyncErrorCallback? onRemoteSyncError;

  Cancelable<void>? _syncTask;
  Cancelable<void>? _syncWebsocketTask;
  Cancelable<void>? _deviceAlbumSyncTask;
  Cancelable<void>? _hashTask;

  BackgroundSyncManager({
    this.onRemoteSyncStart,
    this.onRemoteSyncComplete,
    this.onRemoteSyncError,
  });

  Future<void> cancel() {
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

    return Future.wait(futures);
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> syncLocal({bool full = false}) {
    if (_deviceAlbumSyncTask != null) {
      return _deviceAlbumSyncTask!.future;
    }

    // We use a ternary operator to avoid [_deviceAlbumSyncTask] from being
    // captured by the closure passed to [runInIsolateGentle].
    _deviceAlbumSyncTask = full
        ? runInIsolateGentle(
            computation: (ref) =>
                ref.read(localSyncServiceProvider).sync(full: true),
          )
        : runInIsolateGentle(
            computation: (ref) =>
                ref.read(localSyncServiceProvider).sync(full: false),
          );

    return _deviceAlbumSyncTask!.whenComplete(() {
      _deviceAlbumSyncTask = null;
    });
  }

// No need to cancel the task, as it can also be run when the user logs out
  Future<void> hashAssets() {
    if (_hashTask != null) {
      return _hashTask!.future;
    }

    _hashTask = runInIsolateGentle(
      computation: (ref) => ref.read(hashServiceProvider).hashAssets(),
    );
    return _hashTask!.whenComplete(() {
      _hashTask = null;
    });
  }

  Future<void> syncRemote() {
    if (_syncTask != null) {
      return _syncTask!.future;
    }

    onRemoteSyncStart?.call();

    _syncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
    );
    return _syncTask!.whenComplete(() {
      onRemoteSyncComplete?.call();
      _syncTask = null;
    }).catchError((error) {
      onRemoteSyncError?.call(error.toString());
      _syncTask = null;
    });
  }

  Future<void> syncWebsocketBatch(List<dynamic> batchData) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }

    _syncWebsocketTask = runInIsolateGentle(
      computation: (ref) => ref
          .read(syncStreamServiceProvider)
          .handleWsAssetUploadReadyV1Batch(batchData),
    );
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    });
  }
}
