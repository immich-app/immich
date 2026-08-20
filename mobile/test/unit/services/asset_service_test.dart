import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';
import '../factories/local_asset_factory.dart';
import '../factories/remote_asset_factory.dart';
import '../mocks.dart';

void main() {
  late AssetService sut;
  late RepositoryMocks mocks;
  late MockAssetApiRepository apiRepository;
  late MockRemoteAssetRepository remoteRepository;
  late MockRemoteExifRepository exifRepository;
  late MockDriftLocalAssetRepository localRepository;

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

  group('AssetService.watchAsset', () {
    test('switches from the local asset to its canonical remote asset after upload', () async {
      final localController = StreamController<LocalAsset?>.broadcast();
      final remoteController = StreamController<RemoteAsset?>.broadcast();
      addTearDown(localController.close);
      addTearDown(remoteController.close);

      final local = LocalAssetFactory.create(id: 'local-1');
      final linkedLocal = local.copyWith(remoteId: 'remote-1');
      final remote = RemoteAssetFactory.create(id: 'remote-1', localId: local.id);
      when(() => localRepository.watch(local.id)).thenAnswer((_) => localController.stream);
      when(() => remoteRepository.watch(remote.id)).thenAnswer((_) => remoteController.stream);

      final emitted = <BaseAsset?>[];
      final subscription = sut.watchAsset(local).listen(emitted.add);
      addTearDown(subscription.cancel);

      localController.add(local);
      await pumpEventQueue();
      expect(emitted, [local]);

      localController.add(linkedLocal);
      await pumpEventQueue();
      remoteController.add(remote);
      await pumpEventQueue();

      expect(emitted.last, remote);
    });
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
}
