import 'dart:async';

import 'package:immich_mobile/domain/utils/migrate_cloud_ids.dart' as m;
import 'package:immich_mobile/domain/utils/sync_linked_album.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

typedef SyncCallback = void Function();
typedef SyncCallbackWithResult<T> = void Function(T result);
typedef SyncErrorCallback = void Function(String error);

class BackgroundSyncManager {
  final SyncCallback? onRemoteSyncStart;
  final SyncCallbackWithResult<bool?>? onRemoteSyncComplete;
  final SyncErrorCallback? onRemoteSyncError;

  final SyncCallback? onLocalSyncStart;
  final SyncCallback? onLocalSyncComplete;
  final SyncErrorCallback? onLocalSyncError;

  final SyncCallback? onHashingStart;
  final SyncCallback? onHashingComplete;
  final SyncErrorCallback? onHashingError;

  final SyncCallback? onCloudIdSyncStart;
  final SyncCallback? onCloudIdSyncComplete;
  final SyncErrorCallback? onCloudIdSyncError;

  Cancelable<bool?>? _syncTask;
  Cancelable<void>? _syncWebsocketTask;
  Cancelable<void>? _cloudIdSyncTask;
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
    this.onCloudIdSyncStart,
    this.onCloudIdSyncComplete,
    this.onCloudIdSyncError,
  });

  // The tasks the app-resume path re-runs. One in-flight when the app was suspended
  // stays referenced but frozen, so on resume the dedupe guards would hand back the
  // stale task instead of syncing (#28082). Websocket and cloud-id are excluded - the
  // resume path never restarts them. [_allTasks] builds on this so the lists can't drift.
  List<Cancelable?> get _resumeSyncTasks => [_syncTask, _deviceAlbumSyncTask, _hashTask, _linkedAlbumSyncTask];

  List<Cancelable?> get _allTasks => [_syncWebsocketTask, _cloudIdSyncTask, ..._resumeSyncTasks];

  Future<void> cancel() async {
    final tasks = _allTasks;
    _syncTask = null;
    _syncWebsocketTask = null;
    _cloudIdSyncTask = null;
    _linkedAlbumSyncTask = null;
    _deviceAlbumSyncTask = null;
    _hashTask = null;
    await _cancelAll(tasks);
  }

  Future<void> cancelResumeSyncs() async {
    final tasks = _resumeSyncTasks;
    _syncTask = null;
    _deviceAlbumSyncTask = null;
    _hashTask = null;
    _linkedAlbumSyncTask = null;
    await _cancelAll(tasks);
  }

  // Cancels every task in [tasks] and waits for them to unwind. Callers null out
  // their own fields first, so the sync guards see a clean slate immediately.
  Future<void> _cancelAll(List<Cancelable?> tasks) async {
    final futures = [
      for (final task in tasks)
        if (task != null) task.future,
    ];
    for (final task in tasks) {
      task?.cancel();
    }
    try {
      await Future.wait(futures);
    } on CanceledError {
      // Ignore cancellation errors
    }
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> syncLocal({bool full = false}) {
    if (_deviceAlbumSyncTask != null) {
      return _deviceAlbumSyncTask!.future.catchError((_) {}, test: (error) => error is CanceledError);
    }

    onLocalSyncStart?.call();

    // We use a ternary operator to avoid [_deviceAlbumSyncTask] from being
    // captured by the closure passed to [runInIsolateGentle].
    final task = _deviceAlbumSyncTask = full
        ? runInIsolateGentle(
            computation: (ref) => ref.read(localSyncServiceProvider).sync(full: true),
            debugLabel: 'local-sync-full-true',
          )
        : runInIsolateGentle(
            computation: (ref) => ref.read(localSyncServiceProvider).sync(full: false),
            debugLabel: 'local-sync-full-false',
          );

    return task
        .whenComplete(() {
          if (identical(_deviceAlbumSyncTask, task)) {
            _deviceAlbumSyncTask = null;
          }
          onLocalSyncComplete?.call();
        })
        .catchError((error) {
          if (error is! CanceledError) {
            onLocalSyncError?.call(error.toString());
          }
        });
  }

  Future<void> hashAssets() {
    if (_hashTask != null) {
      return _hashTask!.future.catchError((_) {}, test: (error) => error is CanceledError);
    }

    onHashingStart?.call();

    final task = _hashTask = runInIsolateGentle(
      computation: (ref) => ref.read(hashServiceProvider).hashAssets(),
      debugLabel: 'hash-assets',
    );

    return task
        .whenComplete(() {
          onHashingComplete?.call();
          if (identical(_hashTask, task)) {
            _hashTask = null;
          }
        })
        .catchError((error) {
          if (error is! CanceledError) {
            onHashingError?.call(error.toString());
          }
        });
  }

  Future<bool> syncRemote() {
    if (_syncTask != null) {
      return _syncTask!.future.then((result) => result ?? false).catchError((_) => false);
    }

    onRemoteSyncStart?.call();

    final task = _syncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
      debugLabel: 'remote-sync',
    );
    return task
        .then((result) {
          final success = result ?? false;
          onRemoteSyncComplete?.call(success);
          return success;
        })
        .catchError((error) {
          if (error is! CanceledError) {
            onRemoteSyncError?.call(error.toString());
          }
          return false;
        })
        // A task clears only its own slot: one that was cancelled and superseded by a
        // fresh task (see cancelResumeSyncs) must not null the new task's slot.
        .whenComplete(() {
          if (identical(_syncTask, task)) {
            _syncTask = null;
          }
        });
  }

  Future<void> syncWebsocketBatchV1(List<dynamic> batchData) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }
    _syncWebsocketTask = _handleWsAssetUploadReadyV1Batch(batchData);
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    });
  }

  Future<void> syncWebsocketBatchV2(List<dynamic> batchData) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }
    _syncWebsocketTask = _handleWsAssetUploadReadyV2Batch(batchData);
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    });
  }

  Future<void> syncWebsocketEditV1(dynamic data) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }
    _syncWebsocketTask = _handleWsAssetEditReadyV1(data);
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    });
  }

  Future<void> syncWebsocketEditV2(dynamic data) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }
    _syncWebsocketTask = _handleWsAssetEditReadyV2(data);
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    });
  }

  Future<void> syncLinkedAlbum() {
    if (_linkedAlbumSyncTask != null) {
      return _linkedAlbumSyncTask!.future.catchError((_) {}, test: (error) => error is CanceledError);
    }

    final task = _linkedAlbumSyncTask = runInIsolateGentle(
      computation: syncLinkedAlbumsIsolated,
      debugLabel: 'linked-album-sync',
    );
    return task
        .whenComplete(() {
          if (identical(_linkedAlbumSyncTask, task)) {
            _linkedAlbumSyncTask = null;
          }
        })
        // a cancelled resume sync is not a failure; absorb it so the websocket callers don't get an uncaught error
        .catchError((_) {}, test: (error) => error is CanceledError);
  }

  Future<void> syncCloudIds() {
    if (_cloudIdSyncTask != null) {
      return _cloudIdSyncTask!.future;
    }

    onCloudIdSyncStart?.call();

    _cloudIdSyncTask = runInIsolateGentle(computation: m.syncCloudIds);
    return _cloudIdSyncTask!
        .whenComplete(() {
          onCloudIdSyncComplete?.call();
          _cloudIdSyncTask = null;
        })
        .catchError((error) {
          onCloudIdSyncError?.call(error.toString());
          _cloudIdSyncTask = null;
        });
  }
}

Cancelable<void> _handleWsAssetUploadReadyV1Batch(List<dynamic> batchData) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetUploadReadyV1Batch(batchData),
  debugLabel: 'websocket-batch',
);

Cancelable<void> _handleWsAssetUploadReadyV2Batch(List<dynamic> batchData) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetUploadReadyV2Batch(batchData),
  debugLabel: 'websocket-batch',
);

Cancelable<void> _handleWsAssetEditReadyV1(dynamic data) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetEditReadyV1(data),
  debugLabel: 'websocket-edit',
);

Cancelable<void> _handleWsAssetEditReadyV2(dynamic data) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetEditReadyV2(data),
  debugLabel: 'websocket-edit',
);
