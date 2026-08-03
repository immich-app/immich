import 'dart:async';

import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/main.dart' as app;
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/wm_executor.dart';
import 'package:integration_test/integration_test.dart';
import 'package:openapi/api.dart';

import 'test_utils/fake_immich_server.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  // These tests do real I/O without pumping a widget tree, so disable the fake async clock
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
    await Store.delete(StoreKey.syncMigrationStatus);
  });

  tearDown(() async {
    await workerManagerPatch.dispose();
    await server.close();
    await Store.delete(StoreKey.serverEndpoint);
    await Store.delete(StoreKey.syncMigrationStatus);
  });

  void sendUser(SyncStream stream, String id, String name) {
    stream.send(
      type: SyncEntityType.userV1.toString(),
      data: SyncUserV1(
        id: id,
        name: name,
        email: '$id@test.com',
        hasProfileImage: false,
        deletedAt: null,
        profileChangedAt: DateTime.utc(2025),
      ).toJson(),
      ack: id,
    );
  }

  Future<bool> dbReadable() async {
    try {
      await drift.customSelect('SELECT 1').get().timeout(const Duration(seconds: 5));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<int> userCount() async => (await drift.select(drift.userEntity).get()).length;

  // Starts a remote sync and resolves once its /sync/stream request is open.
  Future<(Future<bool>, SyncStream)> startSync() async {
    final sync = BackgroundSyncManager().syncRemote();
    final stream = await server.streamOpened.timeout(
      const Duration(seconds: 30),
      onTimeout: () => fail('sync isolate never opened /sync/stream'),
    );
    return (sync, stream);
  }

  testWidgets('a full sync ingests streamed events into the shared DB', (tester) async {
    expect(await userCount(), 0);

    final (sync, stream) = await startSync();

    sendUser(stream, 'u1', 'Alice');
    sendUser(stream, 'u2', 'Bob');
    await stream.close();

    final result = await sync.timeout(
      const Duration(seconds: 30),
      onTimeout: () => fail('sync did not complete after the stream ended'),
    );
    expect(result, isTrue);
    expect(await userCount(), 2);
    expect(server.ackRequests, greaterThan(0));
  });

  testWidgets('disposing the pool during an in-flight sync drains promptly', (tester) async {
    final (sync, _) = await startSync();

    final sw = Stopwatch()..start();
    await workerManagerPatch.dispose().timeout(
      const Duration(seconds: 15),
      onTimeout: () => fail('dispose() hung — worker did not drain and exit'),
    );
    expect(sw.elapsed, lessThan(const Duration(seconds: 10)), reason: 'abort-driven, not socket-timeout bound');

    expect(await sync.timeout(const Duration(seconds: 5), onTimeout: () => false), isFalse);
  });

  testWidgets('tearing down a worker blocked mid-write leaves the DB usable', (tester) async {
    final (sync, stream) = await startSync();

    // Hold an exclusive write transaction so the worker's write is blocked. The lock is taken only
    // after the stream opens to avoid blocking the worker's own startup DB reads.
    final releaseTxn = Completer<void>();
    final txnHeld = Completer<void>();
    final txn = drift.transaction(() async {
      await drift.into(drift.userEntity).insert(
            UserEntityCompanion.insert(
              id: 'holder',
              name: 'holder',
              email: 'holder@test.com',
              hasProfileImage: const Value(false),
              profileChangedAt: Value(DateTime.utc(2025)),
            ),
          );
      txnHeld.complete();
      await releaseTxn.future;
    });
    await txnHeld.future;

    sendUser(stream, 'u1', 'Alice');
    await stream.close();

    // dispose() can only finish once the worker unwinds, which is blocked on the
    // lock — so start it, release the lock, then await completion.
    final disposed = workerManagerPatch.dispose();
    releaseTxn.complete();
    await txn;
    await disposed.timeout(
      const Duration(seconds: 15),
      onTimeout: () => fail('dispose() hung after releasing the write lock'),
    );
    await sync.timeout(const Duration(seconds: 5), onTimeout: () => false);

    expect(await dbReadable(), isTrue);
    final users = await drift.select(drift.userEntity).get();
    expect(users.map((u) => u.id), contains('holder'));
  });
}
