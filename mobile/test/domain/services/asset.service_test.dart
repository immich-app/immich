import 'package:flutter/foundation.dart';
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
    test('flips dimensions on Android for 90° and 270° orientations', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      for (final orientation in [90, 270]) {
        final localAsset = TestUtils.createLocalAsset(
          id: 'local-$orientation',
          width: 1920,
          height: 1080,
          orientation: orientation,
        );

        final result = await sut.getAspectRatio(localAsset);

        expect(result, 1080 / 1920, reason: 'Orientation $orientation should flip on Android');
      }
    });

    test('does not flip dimensions on iOS regardless of orientation', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      for (final orientation in [0, 90, 270]) {
        final localAsset = TestUtils.createLocalAsset(
          id: 'local-$orientation',
          width: 1920,
          height: 1080,
          orientation: orientation,
        );

        final result = await sut.getAspectRatio(localAsset);

        expect(result, 1920 / 1080, reason: 'iOS should never flip dimensions');
      }
    });

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

    test('uses fetched asset orientation when dimensions are missing on Android', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      // Original asset has default orientation 0, but dimensions are missing
      final localAsset = TestUtils.createLocalAsset(id: 'local-1', width: null, height: null, orientation: 0);

      // Fetched asset has 90° orientation and proper dimensions
      final fetchedAsset = TestUtils.createLocalAsset(id: 'local-1', width: 1920, height: 1080, orientation: 90);

      when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async => fetchedAsset);

      final result = await sut.getAspectRatio(localAsset);

      // Should flip dimensions since fetched asset has 90° orientation
      expect(result, 1080 / 1920);
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

    test('handles local asset with remoteId using local orientation not remote exif', () async {
      // When a LocalAsset has a remoteId (merged), we should use local orientation
      // because the width/height come from the local asset (pre-corrected on iOS)
      final localAsset = TestUtils.createLocalAsset(
        id: 'local-1',
        remoteId: 'remote-1',
        width: 1920,
        height: 1080,
        orientation: 0,
      );

      final result = await sut.getAspectRatio(localAsset);

      expect(result, 1920 / 1080);
      // Should not call remote exif for LocalAsset
      verifyNever(() => mockRemoteAssetRepository.getExif(any()));
    });

    test('handles local asset with remoteId and 90 degree rotation on Android', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final localAsset = TestUtils.createLocalAsset(
        id: 'local-1',
        remoteId: 'remote-1',
        width: 1920,
        height: 1080,
        orientation: 90,
      );

      final result = await sut.getAspectRatio(localAsset);

      expect(result, 1080 / 1920);
    });

    test('should not flip remote asset dimensions', () async {
      final flippedOrientations = ['1', '2', '3', '4', '5', '6', '7', '8', '90', '-90'];

      for (final orientation in flippedOrientations) {
        final remoteAsset = TestUtils.createRemoteAsset(id: 'remote-$orientation', width: 1920, height: 1080);

        final exif = ExifInfo(orientation: orientation);

        when(() => mockRemoteAssetRepository.getExif('remote-$orientation')).thenAnswer((_) async => exif);

        final result = await sut.getAspectRatio(remoteAsset);

        expect(result, 1920 / 1080, reason: 'Should not flipped remote asset dimensions for orientation $orientation');
      }
    });
  });
}
