import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/main.dart' as app;
import 'package:immich_mobile/providers/app_life_cycle.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/wm_executor.dart';
import 'package:integration_test/integration_test.dart';

import 'test_utils/fake_immich_server.dart';

// Issue #28082: a remote sync in-flight when the app is backgrounded stays referenced
// but frozen across the suspension. On resume the app drops the stale task
// (cancelResumeSyncs) and starts a fresh sync.
//
// Device/emulator tests: real worker isolates + a real drift db + a loopback fake server
// (same pattern as background_sync_teardown_test). The mobile integration-test CI job is
// disabled in test.yml, so like Mert's teardown test this is a local/on-device guard.
void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  late Drift drift;
  late FakeImmichServer server;

  setUpAll(() async {
    await app.initApp();
    (drift, _) = await Bootstrap.initDomain();
  });

  setUp(() async {
    await workerManagerPatch.init(dynamicSpawning: true);
    server = await FakeImmichServer.start();
    await ApiService().resolveAndSetEndpoint(server.endpoint);
    await drift.delete(drift.userEntity).go();
  });

  tearDown(() async {
    // Close the server first so any held-open sync stream ends and its isolate unwinds,
    // then drain the pool - otherwise dispose waits on the frozen read.
    await server.close();
    await workerManagerPatch.dispose();
  });

  // Self-contained (bare manager, no fire-and-forget resume), so it runs first: its
  // frozen syncs are fully drained by tearDown, leaving a clean pool for the next test.
  testWidgets('a cancelled sync task does not clear the slot of the fresh task that superseded it', (tester) async {
    final manager = BackgroundSyncManager();

    // First sync opens /sync/stream and is held open - the frozen suspended state.
    unawaited(manager.syncRemote());
    await server
        .streamOpenedNth(1)
        .timeout(const Duration(seconds: 30), onTimeout: () => fail('first sync isolate never opened /sync/stream'));

    // Resume drops the stale task then immediately starts a fresh one, exactly as
    // _handleBetaTimelineResume does. cancelResumeSyncs cancels the first task; its
    // completion chain then fires and must NOT null the fresh task's slot.
    unawaited(manager.cancelResumeSyncs());
    unawaited(manager.syncRemote());
    await server
        .streamOpenedNth(2)
        .timeout(const Duration(seconds: 30), onTimeout: () => fail('fresh sync isolate never opened /sync/stream'));

    // A third sync stream only opens if the cancelled task cleared the fresh slot,
    // letting the dedupe guard start a redundant sync.
    var thirdOpened = false;
    unawaited(server.streamOpenedNth(3).then((_) => thirdOpened = true));

    // Let the cancelled task's completion chain settle, then ask to sync again.
    await Future.delayed(const Duration(milliseconds: 200));
    unawaited(manager.syncRemote());
    await Future.delayed(const Duration(seconds: 3));

    expect(
      thirdOpened,
      isFalse,
      reason: 'the cancelled task cleared the fresh task slot, so a redundant third sync started (#28082 clobber)',
    );
    expect(server.streamOpenCount, 2);
  });

  // The false-error-flash fix: a task cancelled by cancelResumeSyncs completes with a
  // CanceledError, which is not a sync failure and must not reach onRemoteSyncError.
  // Before the filter the stale task reported an error right after the fresh sync
  // started, so the status UI showed a failure for the whole healthy run.
  testWidgets('a cancelled sync does not report a false error to the status callbacks', (tester) async {
    final errors = <String>[];
    final manager = BackgroundSyncManager(onRemoteSyncError: errors.add);

    // Hold the stream open so the task is genuinely in-flight when it is cancelled.
    unawaited(manager.syncRemote());
    await server
        .streamOpenedNth(1)
        .timeout(const Duration(seconds: 30), onTimeout: () => fail('sync isolate never opened /sync/stream'));

    await manager.cancelResumeSyncs();
    // Let the cancelled task's completion chain run before checking the callbacks.
    await Future.delayed(const Duration(milliseconds: 100));

    expect(
      errors,
      isEmpty,
      reason: 'a cancelled task is not a real error; its CanceledError must not fire onRemoteSyncError',
    );
  });

  // End-to-end resume path. Runs last: handleAppResume is fire-and-forget and its
  // frozen syncs outlive the test, so running it before another test would leave the
  // worker pool warm and starve the next test's isolates.
  testWidgets('a resume after a sync froze mid-flight starts a fresh sync', (tester) async {
    final manager = BackgroundSyncManager();
    // Not disposed on purpose: driftOverride closes the drift on dispose, and this
    // drift is shared across tests via setUpAll. The container only holds the shared
    // drift and a fire-and-forget resume; the frozen isolates + server are drained by
    // tearDown. Disposing here would close the shared DB and break other tests.
    final container = ProviderContainer(
      overrides: [driftProvider.overrideWith(driftOverride(drift)), backgroundSyncProvider.overrideWithValue(manager)],
    );

    // A first sync opens /sync/stream and never finishes - the frozen state a
    // suspended sync isolate is left in. Holding the stream open keeps
    // _syncTask non-null, exactly as it is across an iOS process suspension.
    unawaited(manager.syncRemote());
    await server
        .streamOpenedNth(1)
        .timeout(const Duration(seconds: 30), onTimeout: () => fail('first sync isolate never opened /sync/stream'));

    // The lifecycle then goes background -> foreground. handleAppResume runs the
    // resume sync exactly once. On the buggy build it hangs on the stale task's
    // future, so it is not awaited here.
    final notifier = container.read(appStateProvider.notifier);
    await notifier.handleAppPause();
    notifier.handleAppResume();

    await server
        .streamOpenedNth(2)
        .timeout(
          const Duration(seconds: 25),
          onTimeout: () => fail('resume did not start a fresh remote sync - the stale frozen sync blocked it (#28082)'),
        );
    expect(server.streamOpenCount, greaterThanOrEqualTo(2));
  });
}
