// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:async/async.dart';
import 'package:immich_mobile/providers/infrastructure/sync_stream.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';

class BackgroundSyncManager {
  // This prevents multiple syncs from running at the same time
  final _userSyncCache = AsyncCache.ephemeral();

  BackgroundSyncManager();

  Future<void> syncUsers() => _userSyncCache.fetch(
        () => runInIsolate(
          (ref) => ref.read(syncStreamServiceProvider).syncUsers(),
        ),
      );
}
