import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/services/background_worker.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/main.dart' as app;
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
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
//
// The end-to-end resume test lives in failed_sync_resume_e2e_test.dart - one process
// per file keeps it clear of the cross-test interaction described there.
void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  late Drift drift;
  late FakeImmichServer server;

  // main()'s formula with a higher floor: a wedged frozen worker plus a full local
  // sync must not starve the fresh resume sync out of its 25s window on 4 cores.
  final poolSize = max(Platform.numberOfProcessors - 1, 8);

  setUpAll(() async {
    await app.initApp();
    (drift, _) = await Bootstrap.initDomain();
    // A background-worker schedule persisted by real app use on this device can
    // launch a second engine mid-file (own isolate pool + full sync) and starve
    // these tests on a small device. Unregister it for the whole run.
    await BackgroundWorkerFgService(BackgroundWorkerFgHostApi()).disable();
  });

  setUp(() async {
    // A task completing while dispose tears the pool down re-warms it (_schedule
    // on the cleared pool re-creates workers), and init on a warm pool is silently
    // ignored - poolSize would never apply. Reset first, then verify it took.
    await workerManagerPatch.dispose();
    await workerManagerPatch.init(dynamicSpawning: true, isolatesCount: poolSize);
    expect(
      workerManagerPatch.pool.length,
      poolSize,
      reason: 'init was ignored: a straggler from the previous test re-warmed the pool',
    );
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
  // frozen syncs are fully drained by tearDown.
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
}
