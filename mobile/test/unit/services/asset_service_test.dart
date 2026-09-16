import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
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
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db));
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

    sut = AssetService(
      remoteRepository: remoteRepository,
      exifRepository: exifRepository,
      localRepository: mocks.localAsset.repo,
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
      verify(() => remoteRepository.updateAssets(ids, createdAt: .some(DateTime.parse(picked)))).called(1);
      verify(
        () => exifRepository.updateExif(
          ids,
          dateTimeOriginal: .some(DateTime.parse(picked)),
          timeZone: const .some('UTC+06:00'),
        ),
      ).called(1);
    });

    test('handles negative offsets', () async {
      const picked = '2026-01-05T08:00:00.000-05:30';
      await sut.update(ids, dateTime: const .some(picked));

      verify(() => remoteRepository.updateAssets(ids, createdAt: .some(DateTime.parse(picked)))).called(1);
      verify(
        () => exifRepository.updateExif(
          ids,
          dateTimeOriginal: .some(DateTime.parse(picked)),
          timeZone: const .some('UTC-05:30'),
        ),
      ).called(1);
    });

    test('writes no timezone when the value has no offset', () async {
      const picked = '2026-06-10T13:15:00.000Z';
      await sut.update(ids, dateTime: const .some(picked));

      verify(() => remoteRepository.updateAssets(ids, createdAt: .some(DateTime.parse(picked)))).called(1);
      verify(
        () => exifRepository.updateExif(ids, dateTimeOriginal: .some(DateTime.parse(picked)), timeZone: const .none()),
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

      final result = await sut.deleteLocal(ids, trash: false);

      expect(result, ids.length);
      verify(() => mocks.assetMedia.api.deleteAll(ids, trash: false)).called(1);
      verify(() => mocks.localAsset.repo.deleteAssets(ids)).called(1);
      verifyNever(() => mocks.trashedAsset.applyTrashedAssets(any()));
    });
  });

  group('AssetService.stackEditedUpload', () {
    const stack = StackResponse(id: 'stack', primaryAssetId: 'remote', assetIds: ['remote', 'previous']);

    setUp(() {
      when(() => mocks.localAsset.repo.updatePreviousChecksum(any(), any())).thenAnswer((_) async {});
    });

    test('stacks over the previous version, then records the uploaded checksum', () async {
      when(() => mocks.localAsset.repo.getPreviousRemoteId('local')).thenAnswer((_) async => 'previous');
      when(() => apiRepository.stack(any())).thenAnswer((_) async => stack);

      await sut.stackEditedUpload('local', 'remote', 'sha');

      verifyInOrder([
        () => apiRepository.stack(['remote', 'previous']),
        () => mocks.localAsset.repo.updatePreviousChecksum('local', 'sha'),
      ]);
      verifyNever(() => apiRepository.getChecksum(any()));
    });

    test('records the uploaded checksum when there is nothing to stack on', () async {
      when(() => mocks.localAsset.repo.getPreviousRemoteId('local')).thenAnswer((_) async => null);

      await sut.stackEditedUpload('local', 'remote', 'sha');

      verifyNever(() => apiRepository.stack(any()));
      verify(() => mocks.localAsset.repo.updatePreviousChecksum('local', 'sha')).called(1);
    });

    test('records the uploaded checksum even when the stack call fails', () async {
      when(() => mocks.localAsset.repo.getPreviousRemoteId('local')).thenAnswer((_) async => 'previous');
      when(() => apiRepository.stack(any())).thenThrow(Exception('offline'));

      await expectLater(sut.stackEditedUpload('local', 'remote', 'sha'), throwsException);

      verify(() => mocks.localAsset.repo.updatePreviousChecksum('local', 'sha')).called(1);
    });

    test('asks the server for the checksum when the upload did not know it', () async {
      when(() => mocks.localAsset.repo.getPreviousRemoteId('local')).thenAnswer((_) async => 'previous');
      when(() => apiRepository.getChecksum('remote')).thenAnswer((_) async => 'srv');
      when(() => apiRepository.stack(any())).thenAnswer((_) async => stack);

      await sut.stackEditedUpload('local', 'remote', null);

      verify(() => apiRepository.stack(['remote', 'previous'])).called(1);
      verify(() => mocks.localAsset.repo.updatePreviousChecksum('local', 'srv')).called(1);
    });
  });
}
