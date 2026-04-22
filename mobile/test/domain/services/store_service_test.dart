import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';

const _kAccessToken = '#ThisIsAToken';
const _kBackgroundBackup = false;
const _kGroupAssetsBy = 2;
final _kBackupFailedSince = DateTime.utc(2023);

void main() {
  late StoreService sut;
  late DriftStoreRepository mockDriftStoreRepo;
  late StreamController<List<StoreDto<Object>>> controller;

  setUp(() async {
    controller = StreamController<List<StoreDto<Object>>>.broadcast();
    mockDriftStoreRepo = MockDriftStoreRepository();
    // For generics, we need to provide fallback to each concrete type to avoid runtime errors
    registerFallbackValue(StoreKey.accessToken);
    registerFallbackValue(StoreKey.backupTriggerDelay);
    registerFallbackValue(StoreKey.backgroundBackup);
    registerFallbackValue(StoreKey.backupFailedSince);

    when(() => mockDriftStoreRepo.getAll()).thenAnswer(
      (_) async => [
        const StoreDto(StoreKey.accessToken, _kAccessToken),
        const StoreDto(StoreKey.backgroundBackup, _kBackgroundBackup),
        const StoreDto(StoreKey.groupAssetsBy, _kGroupAssetsBy),
        StoreDto(StoreKey.backupFailedSince, _kBackupFailedSince),
      ],
    );
    when(() => mockDriftStoreRepo.watchAll()).thenAnswer((_) => controller.stream);

    sut = await StoreService.create(storeRepository: mockDriftStoreRepo);
  });

  tearDown(() async {
    unawaited(sut.dispose());
    await controller.close();
  });

  group("Store Service Init:", () {
    test('Populates the internal cache on init', () {
      verify(() => mockDriftStoreRepo.getAll()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), _kAccessToken);
      expect(sut.tryGet(StoreKey.backgroundBackup), _kBackgroundBackup);
      expect(sut.tryGet(StoreKey.groupAssetsBy), _kGroupAssetsBy);
      expect(sut.tryGet(StoreKey.backupFailedSince), _kBackupFailedSince);
      // Other keys should be null
      expect(sut.tryGet(StoreKey.currentUser), isNull);
    });

    test('Listens to stream of store updates', () async {
      final event = StoreDto(StoreKey.accessToken, _kAccessToken.toUpperCase());
      controller.add([event]);

      await pumpEventQueue();

      verify(() => mockDriftStoreRepo.watchAll()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), _kAccessToken.toUpperCase());
    });
  });

  group('Store Service get:', () {
    test('Returns the stored value for the given key', () {
      expect(sut.get(StoreKey.accessToken), _kAccessToken);
    });

    test('Throws StoreKeyNotFoundException for nonexistent keys', () {
      expect(() => sut.get(StoreKey.currentUser), throwsA(isA<StoreKeyNotFoundException>()));
    });

    test('Returns the stored value for the given key or the defaultValue', () {
      expect(sut.get(StoreKey.currentUser, 5), 5);
    });
  });

  group('Store Service put:', () {
    setUp(() {
      when(() => mockDriftStoreRepo.upsert<String>(any<StoreKey<String>>(), any())).thenAnswer((_) async => true);
    });

    test('Skip insert when value is not modified', () async {
      await sut.put(StoreKey.accessToken, _kAccessToken);
      verifyNever(() => mockDriftStoreRepo.upsert<String>(StoreKey.accessToken, any()));
    });

    test('Insert value when modified', () async {
      final newAccessToken = _kAccessToken.toUpperCase();
      await sut.put(StoreKey.accessToken, newAccessToken);
      verify(() => mockDriftStoreRepo.upsert<String>(StoreKey.accessToken, newAccessToken)).called(1);
      expect(sut.tryGet(StoreKey.accessToken), newAccessToken);
    });
  });

  group('Store Service watch:', () {
    late StreamController<String?> valueController;

    setUp(() {
      valueController = StreamController<String?>.broadcast();
      when(() => mockDriftStoreRepo.watch<String>(any<StoreKey<String>>())).thenAnswer((_) => valueController.stream);
    });

    tearDown(() async {
      await valueController.close();
    });

    test('Watches a specific key for changes', () async {
      final stream = sut.watch(StoreKey.accessToken);
      final events = <String?>[_kAccessToken, _kAccessToken.toUpperCase(), null, _kAccessToken.toLowerCase()];

      unawaited(expectLater(stream, emitsInOrder(events)));

      for (final event in events) {
        valueController.add(event);
      }

      await pumpEventQueue();
      verify(() => mockDriftStoreRepo.watch<String>(StoreKey.accessToken)).called(1);
    });
  });

  group('Store Service delete:', () {
    setUp(() {
      when(() => mockDriftStoreRepo.delete<String>(any<StoreKey<String>>())).thenAnswer((_) async => true);
    });

    test('Removes the value from the DB', () async {
      await sut.delete(StoreKey.accessToken);
      verify(() => mockDriftStoreRepo.delete<String>(StoreKey.accessToken)).called(1);
    });

    test('Removes the value from the cache', () async {
      await sut.delete(StoreKey.accessToken);
      expect(sut.tryGet(StoreKey.accessToken), isNull);
    });
  });

  group('Store Service clear:', () {
    setUp(() {
      when(() => mockDriftStoreRepo.deleteAll()).thenAnswer((_) async => true);
    });

    test('Clears all values from the store', () async {
      await sut.clear();
      verify(() => mockDriftStoreRepo.deleteAll()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), isNull);
      expect(sut.tryGet(StoreKey.backgroundBackup), isNull);
      expect(sut.tryGet(StoreKey.groupAssetsBy), isNull);
      expect(sut.tryGet(StoreKey.backupFailedSince), isNull);
    });
  });
}
