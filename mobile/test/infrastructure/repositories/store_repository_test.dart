import 'dart:async';

import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';

const _kTestAccessToken = "#TestToken";
const _kTestVersion = 10;
const _kTestAdvancedTroubleshooting = false;

Future<void> _populateStore(Drift db) async {
  await db.batch((batch) async {
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.legacyAdvancedTroubleshooting.id),
        intValue: const Value(_kTestAdvancedTroubleshooting ? 1 : 0),
        stringValue: const Value(null),
      ),
    );
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.legacyAccessToken.id),
        intValue: const Value(null),
        stringValue: const Value(_kTestAccessToken),
      ),
    );
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.legacyVersion.id),
        intValue: const Value(_kTestVersion),
        stringValue: const Value(null),
      ),
    );
  });
}

void main() {
  late Drift db;
  late DriftStoreRepository sut;

  setUp(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    sut = DriftStoreRepository(db);
  });

  tearDown(() async {
    await db.close();
  });

  group('Store Repository converters:', () {
    test('converts int', () async {
      int? version = await sut.tryGet(StoreKey.legacyVersion);
      expect(version, isNull);
      await sut.upsert(StoreKey.legacyVersion, _kTestVersion);
      version = await sut.tryGet(StoreKey.legacyVersion);
      expect(version, _kTestVersion);
    });

    test('converts string', () async {
      String? accessToken = await sut.tryGet(StoreKey.legacyAccessToken);
      expect(accessToken, isNull);
      await sut.upsert(StoreKey.legacyAccessToken, _kTestAccessToken);
      accessToken = await sut.tryGet(StoreKey.legacyAccessToken);
      expect(accessToken, _kTestAccessToken);
    });

    test('converts bool', () async {
      bool? advancedTroubleshooting = await sut.tryGet(StoreKey.legacyAdvancedTroubleshooting);
      expect(advancedTroubleshooting, isNull);
      await sut.upsert(StoreKey.legacyAdvancedTroubleshooting, _kTestAdvancedTroubleshooting);
      advancedTroubleshooting = await sut.tryGet(StoreKey.legacyAdvancedTroubleshooting);
      expect(advancedTroubleshooting, _kTestAdvancedTroubleshooting);
    });
  });

  group('Store Repository Deletes:', () {
    setUp(() async {
      await _populateStore(db);
    });

    test('delete()', () async {
      bool? advancedTroubleshooting = await sut.tryGet(StoreKey.legacyAdvancedTroubleshooting);
      expect(advancedTroubleshooting, isFalse);
      await sut.delete(StoreKey.legacyAdvancedTroubleshooting);
      advancedTroubleshooting = await sut.tryGet(StoreKey.legacyAdvancedTroubleshooting);
      expect(advancedTroubleshooting, isNull);
    });

    test('deleteAll()', () async {
      final count = await db.storeEntity.count().getSingle();
      expect(count, isNot(isZero));
      await sut.deleteAll();
      unawaited(expectLater(await db.storeEntity.count().getSingle(), isZero));
    });
  });

  group('Store Repository Updates:', () {
    setUp(() async {
      await _populateStore(db);
    });

    test('upsert()', () async {
      int? version = await sut.tryGet(StoreKey.legacyVersion);
      expect(version, _kTestVersion);
      await sut.upsert(StoreKey.legacyVersion, _kTestVersion + 10);
      version = await sut.tryGet(StoreKey.legacyVersion);
      expect(version, _kTestVersion + 10);
    });
  });

  group('Store Repository Watchers:', () {
    setUp(() async {
      await _populateStore(db);
    });

    test('watch()', () async {
      final stream = sut.watch(StoreKey.legacyVersion);
      unawaited(expectLater(stream, emitsInOrder([_kTestVersion, _kTestVersion + 10])));
      await pumpEventQueue();
      await sut.upsert(StoreKey.legacyVersion, _kTestVersion + 10);
    });

    test('watchAll()', () async {
      final stream = sut.watchAll();
      unawaited(
        expectLater(
          stream,
          emitsInOrder([
            [
              const StoreDto<Object>(StoreKey.legacyVersion, _kTestVersion),
              const StoreDto<Object>(StoreKey.legacyAccessToken, _kTestAccessToken),
              const StoreDto<Object>(StoreKey.legacyAdvancedTroubleshooting, _kTestAdvancedTroubleshooting),
            ],
            [
              const StoreDto<Object>(StoreKey.legacyVersion, _kTestVersion + 10),
              const StoreDto<Object>(StoreKey.legacyAccessToken, _kTestAccessToken),
              const StoreDto<Object>(StoreKey.legacyAdvancedTroubleshooting, _kTestAdvancedTroubleshooting),
            ],
          ]),
        ),
      );
      await sut.upsert(StoreKey.legacyVersion, _kTestVersion + 10);
    });
  });
}
