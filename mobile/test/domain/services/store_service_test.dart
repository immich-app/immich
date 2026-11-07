import 'dart:async';

import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';

const _kAccessToken = '#ThisIsAToken';
const _kAdvancedTroubleshooting = false;
const _kVersion = 2;

void main() {
  late StoreService sut;
  late StoreRepository mockDriftStoreRepo;
  late StreamController<Set<TableUpdate>> controller;

  setUp(() async {
    controller = StreamController<Set<TableUpdate>>.broadcast();
    mockDriftStoreRepo = MockStoreRepository();
    // For generics, we need to provide fallback to each concrete type to avoid runtime errors
    registerFallbackValue(StoreKey.accessToken);
    registerFallbackValue(StoreKey.version);
    registerFallbackValue(StoreKey.advancedTroubleshooting);

    when(() => mockDriftStoreRepo.getAll()).thenAnswer(
      (_) async => [
        const StoreDto(StoreKey.accessToken, _kAccessToken),
        const StoreDto(StoreKey.advancedTroubleshooting, _kAdvancedTroubleshooting),
        const StoreDto(StoreKey.version, _kVersion),
      ],
    );
    when(() => mockDriftStoreRepo.watchChanges()).thenAnswer((_) => controller.stream);

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
      expect(sut.tryGet(StoreKey.advancedTroubleshooting), _kAdvancedTroubleshooting);
      expect(sut.tryGet(StoreKey.version), _kVersion);
      // Other keys should be null
      expect(sut.tryGet(StoreKey.currentUser), isNull);
    });

    test('Listens to stream of store updates', () async {
      final event = StoreDto(StoreKey.accessToken, _kAccessToken.toUpperCase());
      when(() => mockDriftStoreRepo.getAll()).thenAnswer((_) async => [event]);
      controller.add({});

      await pumpEventQueue();

      verify(() => mockDriftStoreRepo.watchChanges()).called(1);
      expect(sut.tryGet(StoreKey.accessToken), _kAccessToken.toUpperCase());
    });

    test('Drops keys deleted by another store on the same database', () async {
      final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
      addTearDown(db.close);
      final store = await StoreService.create(storeRepository: StoreRepository(db));
      await store.put(StoreKey.accessToken, _kAccessToken);
      final other = await StoreService.create(storeRepository: StoreRepository(db), listenUpdates: false);

      await other.delete(StoreKey.accessToken);
      await pumpEventQueue();

      expect(store.tryGet(StoreKey.accessToken), isNull);
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

    test('Keeps the inserted value when an older read finishes later', () async {
      final read = Completer<List<StoreDto<Object>>>();
      when(() => mockDriftStoreRepo.getAll()).thenAnswer((_) => read.future);
      controller.add({});
      await pumpEventQueue();

      final newAccessToken = _kAccessToken.toUpperCase();
      final put = sut.put(StoreKey.accessToken, newAccessToken);
      await pumpEventQueue();
      read.complete([const StoreDto(StoreKey.accessToken, _kAccessToken)]);
      await put;
      await pumpEventQueue();

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
      when(() => mockDriftStoreRepo.deleteValue<String>(any<StoreKey<String>>())).thenAnswer((_) async => true);
    });

    test('Removes the value from the DB', () async {
      await sut.delete(StoreKey.accessToken);
      verify(() => mockDriftStoreRepo.deleteValue<String>(StoreKey.accessToken)).called(1);
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
      expect(sut.tryGet(StoreKey.advancedTroubleshooting), isNull);
      expect(sut.tryGet(StoreKey.version), isNull);
    });
  });
}
