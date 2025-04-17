// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync_stream.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundSyncManager {
  Cancelable<void>? _userSyncTask;
  Cancelable<void>? _assetSyncTask;
  Cancelable<void>? _exifSyncTask;

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

  Future<void> syncUsers() {
    if (_userSyncTask != null) {
      return _userSyncTask!.future;
    }

    _userSyncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).syncUsers(),
    );
    _userSyncTask!.whenComplete(() {
      _userSyncTask = null;
    });
    return _userSyncTask!.future;
  }

  Future<void> syncAssets() {
    if (_assetSyncTask != null) {
      return _assetSyncTask!.future;
    }

    _assetSyncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).syncAssets(),
    );

    _assetSyncTask!.whenComplete(() {
      _assetSyncTask = null;
    });

    return _assetSyncTask!.future;
  }

  Future<void> syncExif() {
    if (_exifSyncTask != null) {
      return _exifSyncTask!.future;
    }

    _exifSyncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).syncExif(),
    );

    _exifSyncTask!.whenComplete(() {
      _exifSyncTask = null;
    });

    return _exifSyncTask!.future;
  }
}
