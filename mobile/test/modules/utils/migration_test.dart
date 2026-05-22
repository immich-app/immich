import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/utils/migration.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';

void main() {
  late Drift db;
  late SyncStreamRepository mockSyncStreamRepository;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
    mockSyncStreamRepository = MockSyncStreamRepository();
    when(() => mockSyncStreamRepository.reset()).thenAnswer((_) async => {});
  });

  tearDown(() async {
    await Store.clear();
  });

  group('handleBetaMigration Tests', () {
    group("version < 15", () {
      test('already on new timeline', () async {
        await Store.put(StoreKey.betaTimeline, true);

        await handleBetaMigration(14, false, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), true);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });

      test('already on old timeline', () async {
        await Store.put(StoreKey.betaTimeline, false);

        await handleBetaMigration(14, false, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.needBetaMigration), true);
      });

      test('fresh install', () async {
        await Store.delete(StoreKey.betaTimeline);
        await handleBetaMigration(14, true, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), true);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });
    });

    group("version == 15", () {
      test('already on new timeline', () async {
        await Store.put(StoreKey.betaTimeline, true);

        await handleBetaMigration(15, false, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), true);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });

      test('already on old timeline', () async {
        await Store.put(StoreKey.betaTimeline, false);

        await handleBetaMigration(15, false, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.needBetaMigration), true);
      });

      test('fresh install', () async {
        await Store.delete(StoreKey.betaTimeline);
        await handleBetaMigration(15, true, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), true);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });
    });

    group("version > 15", () {
      test('already on new timeline', () async {
        await Store.put(StoreKey.betaTimeline, true);

        await handleBetaMigration(16, false, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), true);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });

      test('already on old timeline', () async {
        await Store.put(StoreKey.betaTimeline, false);

        await handleBetaMigration(16, false, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), false);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });

      test('fresh install', () async {
        await Store.delete(StoreKey.betaTimeline);
        await handleBetaMigration(16, true, mockSyncStreamRepository);

        expect(Store.tryGet(StoreKey.betaTimeline), true);
        expect(Store.tryGet(StoreKey.needBetaMigration), false);
      });
    });
  });

  group('sync reset tests', () {
    test('version < 16', () async {
      await Store.put(StoreKey.shouldResetSync, false);

      await handleBetaMigration(15, false, mockSyncStreamRepository);

      expect(Store.tryGet(StoreKey.shouldResetSync), true);
    });

    test('version >= 16', () async {
      await Store.put(StoreKey.shouldResetSync, false);

      await handleBetaMigration(16, false, mockSyncStreamRepository);

      expect(Store.tryGet(StoreKey.shouldResetSync), false);
    });
  });
}
