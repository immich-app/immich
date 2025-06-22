import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';

const _kAccessToken = '#ThisIsAToken';
const _kBackgroundBackup = false;
const _kGroupAssetsBy = 2;
final _kBackupFailedSince = DateTime.utc(2023);

void main() {
  late StoreService sut;
  late IStoreRepository mockStoreRepo;
  late StreamController<StoreDto<Object>> controller;

  setUp(() async {
    controller = StreamController<StoreDto<Object>>.broadcast();
    mockStoreRepo = MockStoreRepository();
    // For generics, we need to provide fallback to each concrete type to avoid runtime errors
    registerFallbackValue(StoreKey.accessToken);
    registerFallbackValue(StoreKey.backupTriggerDelay);
    registerFallbackValue(StoreKey.backgroundBackup);
    registerFallbackValue(StoreKey.backupFailedSince);

    when(() => mockStoreRepo.getAll()).thenAnswer(
      (_) async => [
        const StoreDto(StoreKey.accessToken, _kAccessToken),
        const StoreDto(StoreKey.backgroundBackup, _kBackgroundBackup),
        const StoreDto(StoreKey.groupAssetsBy, _kGroupAssetsBy),
        StoreDto(StoreKey.backupFailedSince, _kBackupFailedSince),
      ],
    );
    when(() => mockStoreRepo.watchAll()).thenAnswer((_) => controller.stream);

    sut = await StoreService.create(storeRepository: mockStoreRepo);
  });

  tearDown(() async {
    sut.dispose();
    await controller.close();
  });

  group("Store Service Init:", () {
    test('Populates the internal cache on init', () {
      verify(() => mockStoreRepo.getAll()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), _kAccessToken);
      expect(sut.tryGet(StoreKey.backgroundBackup), _kBackgroundBackup);
      expect(sut.tryGet(StoreKey.groupAssetsBy), _kGroupAssetsBy);
      expect(sut.tryGet(StoreKey.backupFailedSince), _kBackupFailedSince);
      // Other keys should be null
      expect(sut.tryGet(StoreKey.currentUser), isNull);
    });

    test('Listens to stream of store updates', () async {
      final event = StoreDto(StoreKey.accessToken, _kAccessToken.toUpperCase());
      controller.add(event);

      await pumpEventQueue();

      verify(() => mockStoreRepo.watchAll()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), _kAccessToken.toUpperCase());
    });
  });

  group('Store Service get:', () {
    test('Returns the stored value for the given key', () {
      expect(sut.get(StoreKey.accessToken), _kAccessToken);
    });

    test('Throws StoreKeyNotFoundException for nonexistent keys', () {
      expect(
        () => sut.get(StoreKey.currentUser),
        throwsA(isA<StoreKeyNotFoundException>()),
      );
    });

    test('Returns the stored value for the given key or the defaultValue', () {
      expect(sut.get(StoreKey.currentUser, 5), 5);
    });
  });

  group('Store Service put:', () {
    setUp(() {
      when(() => mockStoreRepo.insert<String>(any<StoreKey<String>>(), any()))
          .thenAnswer((_) async => true);
    });

    test('Skip insert when value is not modified', () async {
      await sut.put(StoreKey.accessToken, _kAccessToken);
      verifyNever(
        () => mockStoreRepo.insert<String>(StoreKey.accessToken, any()),
      );
    });

    test('Insert value when modified', () async {
      final newAccessToken = _kAccessToken.toUpperCase();
      await sut.put(StoreKey.accessToken, newAccessToken);
      verify(
        () =>
            mockStoreRepo.insert<String>(StoreKey.accessToken, newAccessToken),
      ).called(1);
      expect(sut.tryGet(StoreKey.accessToken), newAccessToken);
    });
  });

  group('Store Service watch:', () {
    late StreamController<String?> valueController;

    setUp(() {
      valueController = StreamController<String?>.broadcast();
      when(() => mockStoreRepo.watch<String>(any<StoreKey<String>>()))
          .thenAnswer((_) => valueController.stream);
    });

    tearDown(() async {
      await valueController.close();
    });

    test('Watches a specific key for changes', () async {
      final stream = sut.watch(StoreKey.accessToken);
      final events = <String?>[
        _kAccessToken,
        _kAccessToken.toUpperCase(),
        null,
        _kAccessToken.toLowerCase(),
      ];

      expectLater(stream, emitsInOrder(events));

      for (final event in events) {
        valueController.add(event);
      }

      await pumpEventQueue();
      verify(() => mockStoreRepo.watch<String>(StoreKey.accessToken)).called(1);
    });
  });

  group('Store Service delete:', () {
    setUp(() {
      when(() => mockStoreRepo.delete<String>(any<StoreKey<String>>()))
          .thenAnswer((_) async => true);
    });

    test('Removes the value from the DB', () async {
      await sut.delete(StoreKey.accessToken);
      verify(() => mockStoreRepo.delete<String>(StoreKey.accessToken))
          .called(1);
    });

    test('Removes the value from the cache', () async {
      await sut.delete(StoreKey.accessToken);
      expect(sut.tryGet(StoreKey.accessToken), isNull);
    });
  });

  group('Store Service clear:', () {
    setUp(() {
      when(() => mockStoreRepo.deleteAll()).thenAnswer((_) async => true);
    });

    test('Clears all values from the store', () async {
      await sut.clear();
      verify(() => mockStoreRepo.deleteAll()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), isNull);
      expect(sut.tryGet(StoreKey.backgroundBackup), isNull);
      expect(sut.tryGet(StoreKey.groupAssetsBy), isNull);
      expect(sut.tryGet(StoreKey.backupFailedSince), isNull);
    });
  });
}
