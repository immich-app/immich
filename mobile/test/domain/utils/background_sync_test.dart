import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';

class _FakeBackgroundSyncManager extends BackgroundSyncManager {
  final List<String> calls = [];
  final Completer<bool> remoteCompleter = Completer<bool>();

  @override
  Future<bool> syncRemote() {
    calls.add('remote-start');
    return remoteCompleter.future.then((success) {
      calls.add('remote-complete');
      return success;
    });
  }

  @override
  Future<void> syncLocal({bool full = false}) async {
    calls.add('local-full-$full');
  }
}

void main() {
  test('syncRemoteThenLocal defers full local sync until remote sync has completed', () async {
    final manager = _FakeBackgroundSyncManager();

    final result = manager.syncRemoteThenLocal(
      fullLocalSync: true,
      delay: (duration) async {
        manager.calls.add('delay-${duration.inMilliseconds}');
      },
    );

    expect(manager.calls, ['remote-start']);

    manager.remoteCompleter.complete(true);

    expect(await result.remoteSync, isTrue);
    await result.deferredLocalSync;

    expect(manager.calls, ['remote-start', 'remote-complete', 'delay-1500', 'local-full-true']);
  });
}
