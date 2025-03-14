// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:async/async.dart';
import 'package:immich_mobile/providers/infrastructure/sync_stream.provider.dart';
import 'package:immich_mobile/utils/isolate.dart';
import 'package:logging/logging.dart';

class _SyncStreamDriver {
  final _userSyncCache = AsyncCache.ephemeral();
  final _partnerSyncCache = AsyncCache.ephemeral();

  Future<void> syncUsers() => _userSyncCache.fetch(
        () async => runInIsolate(
          (ref) => ref.read(syncStreamServiceProvider).syncUsers(),
        ),
      );

  Future<void> syncPartners() => _partnerSyncCache.fetch(
        () async => runInIsolate(
          (ref) => ref.read(syncStreamServiceProvider).syncPartners(),
        ),
      );
}

class BackgroundSyncManager {
  final Logger _logger = Logger('BackgroundSyncManager');
  Timer? _timer;
  final Duration _duration;
  // This allows us to keep synching in the background while allowing ondemand syncs
  final _driver = _SyncStreamDriver();

  BackgroundSyncManager({required Duration duration}) : _duration = duration;

  Timer _createTimer() {
    return Timer.periodic(_duration, (timer) async {
      _logger.info('Background sync started');
      await _driver.syncUsers();
      await _driver.syncPartners();
      _logger.info('Background sync completed');
    });
  }

  void start() {
    _logger.info('Background sync enabled');
    _timer ??= _createTimer();
  }

  void stop() {
    _logger.info('Background sync disabled');
    _timer?.cancel();
    _timer = null;
  }

  Future<void> syncUsers() => _driver.syncUsers();
  Future<void> syncPartners() => _driver.syncPartners();
}
