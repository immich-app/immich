// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync_stream.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundSyncManager {
  Cancelable<void>? _syncTask;

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

  Future<void> sync() {
    if (_syncTask != null) {
      return _syncTask!.future;
    }

    _syncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).sync(),
    );
    _syncTask!.whenComplete(() {
      _syncTask = null;
    });
    return _syncTask!.future;
  }
}
