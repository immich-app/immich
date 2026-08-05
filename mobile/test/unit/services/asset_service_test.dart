import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';
import '../mocks.dart';

void main() {
  late AssetService sut;
  late RepositoryMocks mocks;
  late MockAssetApiRepository apiRepository;
  late MockRemoteAssetRepository remoteRepository;
  late MockRemoteExifRepository exifRepository;
  late MockDriftLocalAssetRepository localRepository;
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  setUp(() {
    mocks = RepositoryMocks();
    apiRepository = mocks.assetApi.api;
    remoteRepository = mocks.remoteAsset.repo;
    exifRepository = mocks.remoteExif.repo;
    localRepository = MockDriftLocalAssetRepository();

    sut = AssetService(
      remoteRepository: remoteRepository,
      exifRepository: exifRepository,
      localRepository: localRepository,
      apiRepository: apiRepository,
      mediaRepository: mocks.assetMedia.api,
      trashedLocalRepository: mocks.trashedAsset,
    );
  });

  tearDown(() async {
    await Store.delete(StoreKey.manageLocalMediaAndroid);
  });

  group('AssetService.updateDateTime', () {
    const ids = ['asset_id_1'];

    test('sends the picked value to the api with its offset intact', () async {
      const picked = '2026-06-10T19:15:00.000+06:00';
      await sut.update(ids, dateTime: const .some(picked));

      verify(() => apiRepository.update(ids, dateTimeOriginal: const .some(picked))).called(1);
      verify(() => remoteRepository.update(ids, createdAt: .some(DateTime.parse(picked)))).called(1);
      verify(
        () => exifRepository.update(
          ids,
          dateTimeOriginal: .some(DateTime.parse(picked)),
          timeZone: const .some('UTC+06:00'),
        ),
      ).called(1);
    });

    test('handles negative offsets', () async {
      const picked = '2026-01-05T08:00:00.000-05:30';
      await sut.update(ids, dateTime: const .some(picked));

      verify(() => remoteRepository.update(ids, createdAt: .some(DateTime.parse(picked)))).called(1);
      verify(
        () => exifRepository.update(
          ids,
          dateTimeOriginal: .some(DateTime.parse(picked)),
          timeZone: const .some('UTC-05:30'),
        ),
      ).called(1);
    });

    test('writes no timezone when the value has no offset', () async {
      const picked = '2026-06-10T13:15:00.000Z';
      await sut.update(ids, dateTime: const .some(picked));

      verify(() => remoteRepository.update(ids, createdAt: .some(DateTime.parse(picked)))).called(1);
      verify(
        () => exifRepository.update(ids, dateTimeOriginal: .some(DateTime.parse(picked)), timeZone: const .none()),
      ).called(1);
    });

    test('is a no-op when there are no asset ids', () async {
      await sut.update(const [], dateTime: const .some('2026-06-10T19:15:00.000+06:00'));

      verifyZeroInteractions(apiRepository);
      verifyZeroInteractions(remoteRepository);
    });
  });

  group('AssetService.deleteLocal', () {
    const ids = ['l1', 'l2'];

    test('permanently deletes local copies without trashing, even when Android trash handling is on', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      when(() => mocks.assetMedia.api.deleteAll(ids, trash: false)).thenAnswer((_) async => ids);
      when(() => localRepository.delete(ids)).thenAnswer((_) async => {});

      final result = await sut.deleteLocal(ids, trash: false);

      expect(result, ids.length);
      verify(() => mocks.assetMedia.api.deleteAll(ids, trash: false)).called(1);
      verify(() => localRepository.delete(ids)).called(1);
      verifyNever(() => mocks.trashedAsset.applyTrashedAssets(any()));
    });

    test('trashes local copies by default and applies Android trash handling when on', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      when(() => mocks.assetMedia.api.deleteAll(ids, trash: true)).thenAnswer((_) async => ids);
      when(() => mocks.trashedAsset.applyTrashedAssets(ids)).thenAnswer((_) async => {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => mocks.assetMedia.api.deleteAll(ids, trash: true)).called(1);
      verify(() => mocks.trashedAsset.applyTrashedAssets(ids)).called(1);
      verifyNever(() => localRepository.delete(any()));
    });

    test('trashes local copies by default and deletes rows when Android trash handling is off', () async {
      when(() => mocks.assetMedia.api.deleteAll(ids, trash: true)).thenAnswer((_) async => ids);
      when(() => localRepository.delete(ids)).thenAnswer((_) async => {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => mocks.assetMedia.api.deleteAll(ids, trash: true)).called(1);
      verify(() => localRepository.delete(ids)).called(1);
      verifyNever(() => mocks.trashedAsset.applyTrashedAssets(any()));
    });

    test('returns zero when the OS delete is declined', () async {
      when(() => mocks.assetMedia.api.deleteAll(ids, trash: false)).thenAnswer((_) async => const <String>[]);

      final result = await sut.deleteLocal(ids, trash: false);

      expect(result, 0);
      verifyNever(() => localRepository.delete(any()));
      verifyNever(() => mocks.trashedAsset.applyTrashedAssets(any()));
    });

    test('returns only the deleted share of a partial result', () async {
      const deletedIds = ['l1'];
      when(() => mocks.assetMedia.api.deleteAll(ids, trash: false)).thenAnswer((_) async => deletedIds);
      when(() => localRepository.delete(deletedIds)).thenAnswer((_) async => {});

      final result = await sut.deleteLocal(ids, trash: false);

      expect(result, deletedIds.length);
      verify(() => localRepository.delete(deletedIds)).called(1);
    });
  });
}
