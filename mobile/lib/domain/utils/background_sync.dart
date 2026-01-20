import 'dart:async';

import 'package:immich_mobile/domain/utils/migrate_cloud_ids.dart' as m;
import 'package:immich_mobile/domain/utils/sync_linked_album.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';

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

  CancellableTask<bool>? _syncTask;
  CancellableTask<void>? _syncWebsocketTask;
  CancellableTask<void>? _cloudIdSyncTask;
  CancellableTask<void>? _deviceAlbumSyncTask;
  CancellableTask<void>? _linkedAlbumSyncTask;
  CancellableTask<void>? _hashTask;

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

  Future<void> cancel() async {
    _syncTask!.cancel();
    _syncWebsocketTask!.cancel();
    _cloudIdSyncTask!.cancel();
    _linkedAlbumSyncTask!.cancel();

    try {
      await Future.wait(
        [
          _syncTask?.future,
          _syncWebsocketTask?.future,
          _cloudIdSyncTask?.future,
          _linkedAlbumSyncTask?.future,
        ].nonNulls,
      );
    } catch (e) {
      // Ignore cancellation errors and cleanup timeouts
    }

    _syncTask = null;
    _syncWebsocketTask = null;
    _cloudIdSyncTask = null;
    _linkedAlbumSyncTask = null;
  }

  Future<void> cancelLocal() async {
    _hashTask!.cancel();
    _deviceAlbumSyncTask!.cancel();

    try {
      await Future.wait([_hashTask?.future, _deviceAlbumSyncTask?.future].nonNulls);
    } catch (e) {
      // Ignore cancellation errors and cleanup timeouts
    }

    _hashTask = null;
    _deviceAlbumSyncTask = null;
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
        })
        .catchError((error) {
          onLocalSyncError?.call(error.toString());
          _deviceAlbumSyncTask = null;
        })
        .future;
  }

  Future<void> hashAssets() {
    if (_hashTask != null) {
      return _hashTask!.future;
    }

    onHashingStart?.call();

    _hashTask = runInIsolateGentle(
      computation: (ref) => ref.read(hashServiceProvider).hashAssets(),
      debugLabel: 'hash-assets',
    );

    return _hashTask!
        .whenComplete(() {
          onHashingComplete?.call();
          _hashTask = null;
        })
        .catchError((error) {
          onHashingError?.call(error.toString());
          _hashTask = null;
        })
        .future;
  }

  Future<bool> syncRemote() {
    if (_syncTask != null) {
      return _syncTask!.future.then((result) => result ?? false).catchError((_) => false);
    }

    onRemoteSyncStart?.call();

    _syncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
      debugLabel: 'remote-sync',
    );
    return _syncTask!.future
        .then((result) {
          final success = result ?? false;
          onRemoteSyncComplete?.call(success);
          return success;
        })
        .catchError((error) {
          onRemoteSyncError?.call(error.toString());
          _syncTask = null;
          return false;
        })
        .whenComplete(() {
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
    }).future;
  }

  Future<void> syncWebsocketEditBatch(List<dynamic> batchData) {
    if (_syncWebsocketTask != null) {
      return _syncWebsocketTask!.future;
    }
    _syncWebsocketTask = _handleWsAssetEditReadyV1Batch(batchData);
    return _syncWebsocketTask!.whenComplete(() {
      _syncWebsocketTask = null;
    }).future;
  }

  Future<void> syncLinkedAlbum() {
    if (_linkedAlbumSyncTask != null) {
      return _linkedAlbumSyncTask!.future;
    }

    _linkedAlbumSyncTask = runInIsolateGentle(computation: syncLinkedAlbumsIsolated, debugLabel: 'linked-album-sync');
    return _linkedAlbumSyncTask!.whenComplete(() {
      _linkedAlbumSyncTask = null;
    }).future;
  }

  Future<void> syncCloudIds() {
    if (_cloudIdSyncTask != null) {
      return _cloudIdSyncTask!.future;
    }

    onCloudIdSyncStart?.call();

    _cloudIdSyncTask = runInIsolateGentle(computation: m.syncCloudIds, debugLabel: 'cloud-id-sync');
    return _cloudIdSyncTask!
        .whenComplete(() {
          onCloudIdSyncComplete?.call();
          _cloudIdSyncTask = null;
        })
        .catchError((error) {
          onCloudIdSyncError?.call(error.toString());
          _cloudIdSyncTask = null;
        })
        .future;
  }
}

CancellableTask<void> _handleWsAssetUploadReadyV1Batch(List<dynamic> batchData) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetUploadReadyV1Batch(batchData),
  debugLabel: 'websocket-batch',
);

CancellableTask<void> _handleWsAssetEditReadyV1Batch(List<dynamic> batchData) => runInIsolateGentle(
  computation: (ref) => ref.read(syncStreamServiceProvider).handleWsAssetEditReadyV1Batch(batchData),
  debugLabel: 'websocket-edit',
);
