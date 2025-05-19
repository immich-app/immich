// ignore_for_file: avoid-dynamic

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:isar/isar.dart';

import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';

const _kTestAccessToken = "#TestToken";
final _kTestBackupFailed = DateTime(2025, 2, 20, 11, 45);
const _kTestVersion = 10;
const _kTestColorfulInterface = false;
final _kTestUser = UserStub.admin;

Future<void> _addIntStoreValue(Isar db, StoreKey key, int? value) async {
  await db.storeValues.put(StoreValue(key.id, intValue: value, strValue: null));
}

Future<void> _addStrStoreValue(Isar db, StoreKey key, String? value) async {
  await db.storeValues.put(StoreValue(key.id, intValue: null, strValue: value));
}

Future<void> _populateStore(Isar db) async {
  await db.writeTxn(() async {
    await _addIntStoreValue(
      db,
      StoreKey.colorfulInterface,
      _kTestColorfulInterface ? 1 : 0,
    );
    await _addIntStoreValue(
      db,
      StoreKey.backupFailedSince,
      _kTestBackupFailed.millisecondsSinceEpoch,
    );
    await _addStrStoreValue(db, StoreKey.accessToken, _kTestAccessToken);
    await _addIntStoreValue(db, StoreKey.version, _kTestVersion);
  });
}

void main() {
  late Isar db;
  late IStoreRepository sut;

  setUp(() async {
    db = await TestUtils.initIsar();
    sut = IsarStoreRepository(db);
  });

  group('Store Repository converters:', () {
    test('converts int', () async {
      int? version = await sut.tryGet(StoreKey.version);
      expect(version, isNull);
      await sut.insert(StoreKey.version, _kTestVersion);
      version = await sut.tryGet(StoreKey.version);
      expect(version, _kTestVersion);
    });

    test('converts string', () async {
      String? accessToken = await sut.tryGet(StoreKey.accessToken);
      expect(accessToken, isNull);
      await sut.insert(StoreKey.accessToken, _kTestAccessToken);
      accessToken = await sut.tryGet(StoreKey.accessToken);
      expect(accessToken, _kTestAccessToken);
    });

    test('converts datetime', () async {
      DateTime? backupFailedSince =
          await sut.tryGet(StoreKey.backupFailedSince);
      expect(backupFailedSince, isNull);
      await sut.insert(StoreKey.backupFailedSince, _kTestBackupFailed);
      backupFailedSince = await sut.tryGet(StoreKey.backupFailedSince);
      expect(backupFailedSince, _kTestBackupFailed);
    });

    test('converts bool', () async {
      bool? colorfulInterface = await sut.tryGet(StoreKey.colorfulInterface);
      expect(colorfulInterface, isNull);
      await sut.insert(StoreKey.colorfulInterface, _kTestColorfulInterface);
      colorfulInterface = await sut.tryGet(StoreKey.colorfulInterface);
      expect(colorfulInterface, _kTestColorfulInterface);
    });

    test('converts user', () async {
      UserDto? user = await sut.tryGet(StoreKey.currentUser);
      expect(user, isNull);
      await sut.insert(StoreKey.currentUser, _kTestUser);
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
      final count = await db.storeValues.count();
      expect(count, isNot(isZero));
      await sut.deleteAll();
      expectLater(await db.storeValues.count(), isZero);
    });
  });

  group('Store Repository Updates:', () {
    setUp(() async {
      await _populateStore(db);
    });

    test('update()', () async {
      int? version = await sut.tryGet(StoreKey.version);
      expect(version, _kTestVersion);
      await sut.update(StoreKey.version, _kTestVersion + 10);
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
      expectLater(stream, emitsInOrder([_kTestVersion, _kTestVersion + 10]));
      await pumpEventQueue();
      await sut.update(StoreKey.version, _kTestVersion + 10);
    });

    test('watchAll()', () async {
      final stream = sut.watchAll();
      expectLater(
        stream,
        emitsInAnyOrder([
          emits(
            const StoreUpdateEvent<dynamic>(StoreKey.version, _kTestVersion),
          ),
          emits(
            StoreUpdateEvent<dynamic>(
              StoreKey.backupFailedSince,
              _kTestBackupFailed,
            ),
          ),
          emits(
            const StoreUpdateEvent<dynamic>(
              StoreKey.accessToken,
              _kTestAccessToken,
            ),
          ),
          emits(
            const StoreUpdateEvent<dynamic>(
              StoreKey.colorfulInterface,
              _kTestColorfulInterface,
            ),
          ),
          emits(
            const StoreUpdateEvent<dynamic>(
              StoreKey.version,
              _kTestVersion + 10,
            ),
          ),
        ]),
      );
      await sut.update(StoreKey.version, _kTestVersion + 10);
    });
  });
}
