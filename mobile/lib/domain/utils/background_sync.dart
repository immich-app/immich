// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundSyncManager {
  Cancelable<void>? _userSyncTask;
  Cancelable<void>? _deviceAlbumSyncTask;

  BackgroundSyncManager();

  Future<void> cancel() {
    final futures = <Future>[];
    if (_userSyncTask != null) {
      futures.add(_userSyncTask!.future);
    }
    _userSyncTask?.cancel();
    _userSyncTask = null;
    return Future.wait(futures);
  }

  // No need to cancel the task, as it can also be run when the user logs out
  Future<void> syncDeviceAlbums() {
    if (_deviceAlbumSyncTask != null) {
      return _deviceAlbumSyncTask!.future;
    }

    _deviceAlbumSyncTask = runInIsolateGentle(
      computation: (ref) => ref.read(deviceSyncServiceProvider).syncAlbums(),
    );
    return _deviceAlbumSyncTask!.whenComplete(() {
      _deviceAlbumSyncTask = null;
    });
  }

  Future<void> syncUsers() {
    if (_userSyncTask != null) {
      return _userSyncTask!.future;
    }

    _userSyncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).syncUsers(),
    );
    return _userSyncTask!
      ..whenComplete(() {
        _userSyncTask = null;
      });
  }
}
