import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../api.mocks.dart';
import '../domain/service.mock.dart';
import '../fixtures/asset.stub.dart';
import '../infrastructure/repository.mock.dart';
import '../repository.mocks.dart';
import '../service.mocks.dart';

class FakeAssetBulkUpdateDto extends Fake implements AssetBulkUpdateDto {}

void main() {
  late AssetService sut;

  late MockAssetRepository assetRepository;
  late MockAssetApiRepository assetApiRepository;
  late MockExifInfoRepository exifInfoRepository;
  late MockETagRepository eTagRepository;
  late MockBackupAlbumRepository backupAlbumRepository;
  late MockIsarUserRepository userRepository;
  late MockAssetMediaRepository assetMediaRepository;
  late MockApiService apiService;

  late MockSyncService syncService;
  late MockAlbumService albumService;
  late MockBackupService backupService;
  late MockUserService userService;

  setUp(() {
    assetRepository = MockAssetRepository();
    assetApiRepository = MockAssetApiRepository();
    exifInfoRepository = MockExifInfoRepository();
    userRepository = MockIsarUserRepository();
    eTagRepository = MockETagRepository();
    backupAlbumRepository = MockBackupAlbumRepository();
    apiService = MockApiService();
    assetMediaRepository = MockAssetMediaRepository();

    syncService = MockSyncService();
    userService = MockUserService();
    albumService = MockAlbumService();
    backupService = MockBackupService();

    sut = AssetService(
      assetApiRepository,
      assetRepository,
      exifInfoRepository,
      userRepository,
      eTagRepository,
      backupAlbumRepository,
      apiService,
      syncService,
      backupService,
      albumService,
      userService,
      assetMediaRepository,
    );

    registerFallbackValue(FakeAssetBulkUpdateDto());
  });

  group("Edit ExifInfo", () {
    late AssetsApi assetsApi;
    setUp(() {
      assetsApi = MockAssetsApi();
      when(() => apiService.assetsApi).thenReturn(assetsApi);
      when(() => assetsApi.updateAssets(any()))
          .thenAnswer((_) async => Future.value());
    });

    test("asset is updated with DateTime", () async {
      final assets = [AssetStub.image1, AssetStub.image2];
      final dateTime = DateTime.utc(2025, 6, 4, 2, 57);
      await sut.changeDateTime(assets, dateTime.toIso8601String());

      verify(() => assetsApi.updateAssets(any())).called(1);
      final upsertExifCallback =
          verify(() => syncService.upsertAssetsWithExif(captureAny()));
      upsertExifCallback.called(1);
      final receivedAssets =
          upsertExifCallback.captured.firstOrNull as List<Object>? ?? [];
      final receivedDatetime = receivedAssets.cast<Asset>().map(
            (a) => a.exifInfo?.dateTimeOriginal ?? DateTime(0),
          );
      expect(receivedDatetime.every((d) => d == dateTime), isTrue);
    });

    test("asset is updated with LatLng", () async {
      final assets = [AssetStub.image1, AssetStub.image2];
      final latLng = const LatLng(37.7749, -122.4194);
      await sut.changeLocation(assets, latLng);

      verify(() => assetsApi.updateAssets(any())).called(1);
      final upsertExifCallback =
          verify(() => syncService.upsertAssetsWithExif(captureAny()));
      upsertExifCallback.called(1);
      final receivedAssets =
          upsertExifCallback.captured.firstOrNull as List<Object>? ?? [];
      final receivedCoords = receivedAssets.cast<Asset>().map(
            (a) =>
                LatLng(a.exifInfo?.latitude ?? 0, a.exifInfo?.longitude ?? 0),
          );
      expect(receivedCoords.every((l) => l == latLng), isTrue);
    });
  });
}
