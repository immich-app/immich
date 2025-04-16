// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/providers/infrastructure/sync_stream.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundSyncManager {
  Cancelable<void>? _userSyncTask;

  BackgroundSyncManager();

  void cancel() {
    _userSyncTask?.cancel();
    _userSyncTask = null;
  }

  Future<void> syncUsers() async {
    if (_userSyncTask != null) {
      return _userSyncTask!.future;
    }

    _userSyncTask = runInIsolateGentle(
      computation: (ref) => ref.read(syncStreamServiceProvider).syncUsers(),
    );
    _userSyncTask!.whenComplete(() {
      _userSyncTask = null;
    });
  }
}
