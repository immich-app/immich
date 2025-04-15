// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:async/async.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync_stream.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';

class BackgroundSyncManager {
  CancelableOperation<void>? _userSyncFuture;

  BackgroundSyncManager();

  Future<void> cancel() async {
    await _userSyncFuture?.cancel();
    _userSyncFuture = null;
  }

  Future<void> syncUsers() async {
    if (_userSyncFuture != null) {
      return _userSyncFuture!.valueOrCancellation();
    }

    if (_userSyncFuture == null) {
      final isolate = await IsolateManager.spawn(
        computation: (ref) => ref.read(syncStreamServiceProvider).syncUsers(),
        onCancel: (ref) => ref.read(cancellationProvider).complete(true),
      );
      _userSyncFuture = CancelableOperation.fromFuture(
        isolate.run(),
        onCancel: () {
          isolate.cancel();
          _userSyncFuture = null;
        },
      );
      return _userSyncFuture!
          .valueOrCancellation()
          .then((_) => _userSyncFuture = null);
    }
  }
}
