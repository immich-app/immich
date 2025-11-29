import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';
import '../../test_utils.dart';

void main() {
  late AssetService sut;
  late MockRemoteAssetRepository mockRemoteAssetRepository;
  late MockDriftLocalAssetRepository mockLocalAssetRepository;

  setUp(() {
    mockRemoteAssetRepository = MockRemoteAssetRepository();
    mockLocalAssetRepository = MockDriftLocalAssetRepository();
    sut = AssetService(
      remoteAssetRepository: mockRemoteAssetRepository,
      localAssetRepository: mockLocalAssetRepository,
    );
  });

  group('getAspectRatio', () {
    test('fetches dimensions from remote repository when missing from asset', () async {
      final remoteAsset = TestUtils.createRemoteAsset(id: 'remote-1', width: null, height: null);

      final exif = const ExifInfo(orientation: '1');

      final fetchedAsset = TestUtils.createRemoteAsset(id: 'remote-1', width: 1920, height: 1080);

      when(() => mockRemoteAssetRepository.getExif('remote-1')).thenAnswer((_) async => exif);
      when(() => mockRemoteAssetRepository.get('remote-1')).thenAnswer((_) async => fetchedAsset);

      final result = await sut.getAspectRatio(remoteAsset);

      expect(result, 1920 / 1080);
      verify(() => mockRemoteAssetRepository.get('remote-1')).called(1);
    });

    test('fetches dimensions from local repository when missing from local asset', () async {
      final localAsset = TestUtils.createLocalAsset(id: 'local-1', width: null, height: null, orientation: 0);

      final fetchedAsset = TestUtils.createLocalAsset(id: 'local-1', width: 1920, height: 1080, orientation: 0);

      when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async => fetchedAsset);

      final result = await sut.getAspectRatio(localAsset);

      expect(result, 1920 / 1080);
      verify(() => mockLocalAssetRepository.get('local-1')).called(1);
    });

    test('returns 1.0 when dimensions are still unavailable after fetching', () async {
      final remoteAsset = TestUtils.createRemoteAsset(id: 'remote-1', width: null, height: null);

      final exif = const ExifInfo(orientation: '1');

      when(() => mockRemoteAssetRepository.getExif('remote-1')).thenAnswer((_) async => exif);
      when(() => mockRemoteAssetRepository.get('remote-1')).thenAnswer((_) async => null);

      final result = await sut.getAspectRatio(remoteAsset);

      expect(result, 1.0);
    });

    test('returns 1.0 when height is zero', () async {
      final remoteAsset = TestUtils.createRemoteAsset(id: 'remote-1', width: 1920, height: 0);

      final exif = const ExifInfo(orientation: '1');

      when(() => mockRemoteAssetRepository.getExif('remote-1')).thenAnswer((_) async => exif);

      final result = await sut.getAspectRatio(remoteAsset);

      expect(result, 1.0);
    });

    test('handles local asset with remoteId and uses remote dimensions', () async {
      final localAsset = TestUtils.createLocalAsset(
        id: 'local-1',
        remoteId: 'remote-1',
        width: null,
        height: null,
        orientation: 0,
      );

      when(
        () => mockRemoteAssetRepository.get('remote-1'),
      ).thenAnswer((_) async => TestUtils.createRemoteAsset(id: 'remote-1', width: 1920, height: 1080));

      final result = await sut.getAspectRatio(localAsset);
      verify(() => mockRemoteAssetRepository.get('remote-1')).called(1);

      expect(result, 1920 / 1080);
    });
  });
}
