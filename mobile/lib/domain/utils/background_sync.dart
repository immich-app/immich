import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundSyncManager {
  Cancelable<void>? _syncTask;
  Cancelable<void>? _deviceAlbumSyncTask;

  BackgroundSyncManager();

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
    if (_deviceAlbumSyncTask != null) {
      return _deviceAlbumSyncTask!.future;
    }

    _deviceAlbumSyncTask = runInIsolateGentle(
      computation: (ref) =>
          ref.read(deviceSyncServiceProvider).sync(full: full),
    );

    return _deviceAlbumSyncTask!.whenComplete(() {
      _deviceAlbumSyncTask = null;
    });
  }

  Future<void> syncRemote() {
    if (_syncTask != null) {
      return _syncTask!.future;
    }

    _syncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
    );
    return _syncTask!.whenComplete(() {
      _syncTask = null;
    });
  }
}
