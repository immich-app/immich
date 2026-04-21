import 'dart:async';

import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';

import '../../fixtures/user.stub.dart';

const _kTestAccessToken = "#TestToken";
final _kTestBackupFailed = DateTime(2025, 2, 20, 11, 45);
const _kTestVersion = 10;
const _kTestColorfulInterface = false;
final _kTestUser = UserStub.admin;

Future<void> _populateStore(Drift db) async {
  await db.batch((batch) async {
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.colorfulInterface.id),
        intValue: const Value(_kTestColorfulInterface ? 1 : 0),
        stringValue: const Value(null),
      ),
    );
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.backupFailedSince.id),
        intValue: Value(_kTestBackupFailed.millisecondsSinceEpoch),
        stringValue: const Value(null),
      ),
    );
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.accessToken.id),
        intValue: const Value(null),
        stringValue: const Value(_kTestAccessToken),
      ),
    );
    batch.insert(
      db.storeEntity,
      StoreEntityCompanion(
        id: Value(StoreKey.version.id),
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
      int? version = await sut.tryGet(StoreKey.version);
      expect(version, isNull);
      await sut.upsert(StoreKey.version, _kTestVersion);
      version = await sut.tryGet(StoreKey.version);
      expect(version, _kTestVersion);
    });

    test('converts string', () async {
      String? accessToken = await sut.tryGet(StoreKey.accessToken);
      expect(accessToken, isNull);
      await sut.upsert(StoreKey.accessToken, _kTestAccessToken);
      accessToken = await sut.tryGet(StoreKey.accessToken);
      expect(accessToken, _kTestAccessToken);
    });

    test('converts datetime', () async {
      DateTime? backupFailedSince = await sut.tryGet(StoreKey.backupFailedSince);
      expect(backupFailedSince, isNull);
      await sut.upsert(StoreKey.backupFailedSince, _kTestBackupFailed);
      backupFailedSince = await sut.tryGet(StoreKey.backupFailedSince);
      expect(backupFailedSince, _kTestBackupFailed);
    });

    test('converts bool', () async {
      bool? colorfulInterface = await sut.tryGet(StoreKey.colorfulInterface);
      expect(colorfulInterface, isNull);
      await sut.upsert(StoreKey.colorfulInterface, _kTestColorfulInterface);
      colorfulInterface = await sut.tryGet(StoreKey.colorfulInterface);
      expect(colorfulInterface, _kTestColorfulInterface);
    });

    test('converts user', () async {
      UserDto? user = await sut.tryGet(StoreKey.currentUser);
      expect(user, isNull);
      await sut.upsert(StoreKey.currentUser, _kTestUser);
      user = await sut.tryGet(StoreKey.currentUser);
      expect(user, _kTestUser);
    });
  });

  group('Store Repository Deletes:', () {
    setUp(() async {
      await _populateStore(db);
    });

    test('delete()', () async {
      bool? isColorful = await sut.tryGet(StoreKey.colorfulInterface);
      expect(isColorful, isFalse);
      await sut.delete(StoreKey.colorfulInterface);
      isColorful = await sut.tryGet(StoreKey.colorfulInterface);
      expect(isColorful, isNull);
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
      int? version = await sut.tryGet(StoreKey.version);
      expect(version, _kTestVersion);
      await sut.upsert(StoreKey.version, _kTestVersion + 10);
      version = await sut.tryGet(StoreKey.version);
      expect(version, _kTestVersion + 10);
    });
  });

  group('Store Repository Watchers:', () {
    setUp(() async {
      await _populateStore(db);
    });

    test('watch()', () async {
      final stream = sut.watch(StoreKey.version);
      unawaited(expectLater(stream, emitsInOrder([_kTestVersion, _kTestVersion + 10])));
      await pumpEventQueue();
      await sut.upsert(StoreKey.version, _kTestVersion + 10);
    });

    test('watchAll()', () async {
      final stream = sut.watchAll();
      unawaited(
        expectLater(
          stream,
          emitsInOrder([
            [
              const StoreDto<Object>(StoreKey.version, _kTestVersion),
              StoreDto<Object>(StoreKey.backupFailedSince, _kTestBackupFailed),
              const StoreDto<Object>(StoreKey.accessToken, _kTestAccessToken),
              const StoreDto<Object>(StoreKey.colorfulInterface, _kTestColorfulInterface),
            ],
            [
              const StoreDto<Object>(StoreKey.version, _kTestVersion + 10),
              StoreDto<Object>(StoreKey.backupFailedSince, _kTestBackupFailed),
              const StoreDto<Object>(StoreKey.accessToken, _kTestAccessToken),
              const StoreDto<Object>(StoreKey.colorfulInterface, _kTestColorfulInterface),
            ],
          ]),
        ),
      );
      await sut.upsert(StoreKey.version, _kTestVersion + 10);
    });
  });
}
