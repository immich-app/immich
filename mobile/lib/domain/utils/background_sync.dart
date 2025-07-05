import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundSyncManager {
  Cancelable<void>? _syncTask;
  Cancelable<void>? _deviceAlbumSyncTask;
  Cancelable<void>? _hashTask;

  Completer<void>? _localSyncMutex;
  Completer<void>? _remoteSyncMutex;
  Completer<void>? _hashMutex;

  BackgroundSyncManager();

  Future<T> _withMutex<T>(
    Completer<void>? Function() getMutex,
    void Function(Completer<void>?) setMutex,
    Future<T> Function() operation,
  ) async {
    while (getMutex() != null) {
      await getMutex()!.future;
    }

    final mutex = Completer<void>();
    setMutex(mutex);

    try {
      final result = await operation();
      return result;
    } finally {
      setMutex(null);
      mutex.complete();
    }
  }

  Future<T> _withLocalSyncMutex<T>(Future<T> Function() operation) {
    return _withMutex(
      () => _localSyncMutex,
      (mutex) => _localSyncMutex = mutex,
      operation,
    );
  }

  Future<T> _withRemoteSyncMutex<T>(Future<T> Function() operation) {
    return _withMutex(
      () => _remoteSyncMutex,
      (mutex) => _remoteSyncMutex = mutex,
      operation,
    );
  }

  Future<T> _withHashMutex<T>(Future<T> Function() operation) {
    return _withMutex(
      () => _hashMutex,
      (mutex) => _hashMutex = mutex,
      operation,
    );
  }

  Future<void> cancel() {
    final futures = <Future>[];

    if (_syncTask != null) {
      futures.add(_syncTask!.future);
    }
    _syncTask?.cancel();
    _syncTask = null;

    return Future.wait(futures);
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> syncLocal({bool full = false}) {
    return _withLocalSyncMutex(() async {
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
    });
  }

// No need to cancel the task, as it can also be run when the user logs out
  Future<void> hashAssets() {
    return _withHashMutex(() async {
      if (_hashTask != null) {
        return _hashTask!.future;
      }

      _hashTask = runInIsolateGentle(
        computation: (ref) => ref.read(hashServiceProvider).hashAssets(),
      );
      return _hashTask!.whenComplete(() {
        _hashTask = null;
      });
    });
  }

  Future<void> syncRemote() {
    return _withRemoteSyncMutex(() async {
      if (_syncTask != null) {
        return _syncTask!.future;
      }

      _syncTask = runInIsolateGentle(
        computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
      );
      return _syncTask!.whenComplete(() {
        _syncTask = null;
      });
    });
  }
}
