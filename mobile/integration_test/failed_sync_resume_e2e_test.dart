import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/services/background_worker.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/main.dart' as app;
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/providers/app_life_cycle.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/wm_executor.dart';
import 'package:integration_test/integration_test.dart';

import 'test_utils/fake_immich_server.dart';

// Issue #28082 end-to-end: a resume after a sync froze mid-flight starts a fresh sync.
// Kept in its own file on purpose: run after the failed_sync_resume tests in one process,
// the resume sync starves past its window - a cross-test interaction that survived pool,
// sqlite and bg-worker audits unnamed. One file per process is device-proven green.
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

  testWidgets('a resume after a sync froze mid-flight starts a fresh sync', (tester) async {
    final manager = BackgroundSyncManager();
    // Not disposed on purpose: driftOverride closes the drift on dispose, and that
    // drift belongs to setUpAll. The container only holds the shared drift and a
    // fire-and-forget resume; the frozen isolates + server are drained by tearDown.
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
    unawaited(notifier.handleAppResume());

    await server
        .streamOpenedNth(2)
        .timeout(
          const Duration(seconds: 25),
          onTimeout: () => fail('resume did not start a fresh remote sync - the stale frozen sync blocked it (#28082)'),
        );
    expect(server.streamOpenCount, greaterThanOrEqualTo(2));
  });
}
