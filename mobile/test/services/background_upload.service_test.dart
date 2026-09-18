import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:mocktail/mocktail.dart';

import '../fixtures/asset.stub.dart';
import '../infrastructure/repository.mock.dart';
import '../service.mocks.dart';

void main() {
  late BackgroundUploadService sut;
  late MockUploadRepository mockUploadRepository;
  late MockStorageRepository mockStorageRepository;
  late MockLocalAssetRepository mockLocalAssetRepository;
  late MockBackupRepository mockBackupRepository;
  late MockAssetService mockAssetService;
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (MethodCall methodCall) async => 'test',
    );
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db));
    await SettingsRepository.ensureInitialized(db);

    await Store.put(StoreKey.serverEndpoint, 'http://test-server.com');
    await Store.put(StoreKey.deviceId, 'test-device-id');
  });

  setUp(() {
    mockUploadRepository = MockUploadRepository();
    mockStorageRepository = MockStorageRepository();
    mockLocalAssetRepository = MockLocalAssetRepository();
    mockBackupRepository = MockBackupRepository();
    mockAssetService = MockAssetService();
    when(() => mockAssetService.stackEditedUpload(any(), any(), any())).thenAnswer((_) async {});

    sut = BackgroundUploadService(
      mockUploadRepository,
      mockStorageRepository,
      mockLocalAssetRepository,
      mockBackupRepository,
      mockAssetService,
    );

    mockUploadRepository.onUploadStatus = (_) {};
    mockUploadRepository.onTaskProgress = (_) {};
  });

  tearDown(() {
    sut.dispose();
  });

  group('getUploadTask', () {
    test('uses the original filename returned with the file for a regular photo', () async {
      final asset = LocalAssetStub.image1;
      final mockFile = File('/path/to/file.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'OriginalPhoto.jpg', isLivePhoto: false));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('OriginalPhoto.jpg'));
    });

    test('falls back to the asset name when the original filename is null', () async {
      final asset = LocalAssetStub.image2;
      final mockFile = File('/path/to/file.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: null, isLivePhoto: false));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.fields['filename'], equals(asset.name));
    });

    test('uploads the motion file of a live photo hidden', () async {
      final asset = LocalAssetStub.image1;
      final stillFile = File('/path/to/file.heic');
      final mockFile = File('/path/to/file.mov');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: stillFile, originalFileName: 'OriginalLivePhoto.HEIC', isLivePhoto: true));
      when(
        () => mockStorageRepository.getMotionFileForAsset(asset),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'OriginalLivePhoto.HEIC', isLivePhoto: true));

      final task = await sut.getUploadTask(asset);
      expect(task, isNotNull);
      // For live photos, extension should be changed to match the video file
      expect(task!.fields['filename'], equals('OriginalLivePhoto.mov'));
      expect(task.fields['visibility'], equals('hidden'));
    });

    test('deletes the still copy it exported to learn the live photo flag', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);
      final asset = LocalAssetStub.image1;
      final dir = Directory.systemTemp.createTempSync();
      addTearDown(() => dir.deleteSync(recursive: true));
      final stillFile = File('${dir.path}/live.heic')..writeAsStringSync('still');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: stillFile, originalFileName: 'live.heic', isLivePhoto: true));
      when(
        () => mockStorageRepository.getMotionFileForAsset(asset),
      ).thenAnswer((_) async => (file: File('/path/to/live.mov'), originalFileName: 'live.mov', isLivePhoto: true));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(stillFile.existsSync(), isFalse);
    });

    test('should not set visibility for a regular photo', () async {
      final asset = LocalAssetStub.image1;
      final mockFile = File('/path/to/file.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'Regular.jpg', isLivePhoto: false));

      final task = await sut.getUploadTask(asset);
      expect(task, isNotNull);
      expect(task!.fields.containsKey('visibility'), isFalse);
    });

    test('corrects the extension when iOS returns a rendered file for a .dng asset', () async {
      final asset = LocalAssetStub.image1;
      final mockFile = File('/path/to/IMG_6499.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'IMG_6499.dng', isLivePhoto: false));

      final task = await sut.getUploadTask(asset);
      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('IMG_6499.jpg'));
    });

    test('keeps the .dng extension for a genuine RAW original', () async {
      final asset = LocalAssetStub.image1;
      final mockFile = File('/path/to/IMG_5210.dng');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'IMG_5210.dng', isLivePhoto: false));

      final task = await sut.getUploadTask(asset);
      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('IMG_5210.dng'));
    });

    test('borrows the extension from the asset name for an extensionless name (DJI/Fusion)', () async {
      final asset = LocalAssetStub.image1;
      final mockFile = File('/path/to/DJI_0001');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'DJI_0001', isLivePhoto: false));

      final task = await sut.getUploadTask(asset);
      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('DJI_0001.jpg'));
    });
  });

  group('getLivePhotoUploadTask', () {
    test('uses the original filename returned with the still file', () async {
      final asset = LocalAssetStub.image1.copyWith(playbackStyle: AssetPlaybackStyle.livePhoto);
      final mockFile = File('/path/to/livephoto.heic');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'OriginalLivePhoto.HEIC', isLivePhoto: true));

      final task = await sut.getLivePhotoUploadTask(asset, 'video-id-123');

      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('OriginalLivePhoto.HEIC'));
      expect(task.fields['livePhotoVideoId'], equals('video-id-123'));
      expect(task.fields.containsKey('visibility'), isFalse);
    });

    test('falls back to the asset name when the original filename is null', () async {
      final asset = LocalAssetStub.image2.copyWith(playbackStyle: AssetPlaybackStyle.livePhoto);
      final mockFile = File('/path/to/fallback.heic');

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: null, isLivePhoto: true));

      final task = await sut.getLivePhotoUploadTask(asset, 'video-id-456');
      expect(task, isNotNull);
      // Should fall back to asset.name when original filename is null
      expect(task!.fields['filename'], equals(asset.name));
    });
  });

  group('Server Info - cloudId and eTag metadata', () {
    test('should include cloudId and eTag metadata on iOS when server version is 2.4+', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final sutWithV24 = BackgroundUploadService(
        mockUploadRepository,
        mockStorageRepository,
        mockLocalAssetRepository,
        mockBackupRepository,
        mockAssetService,
      );
      addTearDown(() => sutWithV24.dispose());

      final assetWithCloudId = LocalAsset(
        id: 'test-asset-id',
        name: 'test.jpg',
        type: AssetType.image,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 2),
        cloudId: 'cloud-id-123',
        latitude: 37.7749,
        longitude: -122.4194,
        adjustmentTime: DateTime(2026, 1, 2),
        playbackStyle: AssetPlaybackStyle.image,
        isEdited: false,
      );

      final mockFile = File('/path/to/test.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(assetWithCloudId.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'test.jpg', isLivePhoto: false));

      final task = await sutWithV24.getUploadTask(assetWithCloudId);

      expect(task, isNotNull);
      expect(task!.fields.containsKey('metadata'), isTrue);

      final metadata = jsonDecode(task.fields['metadata']!) as List;
      expect(metadata, hasLength(1));
      expect(metadata[0]['key'], equals('mobile-app'));
      expect(metadata[0]['value']['iCloudId'], equals('cloud-id-123'));
      expect(metadata[0]['value']['createdAt'], isNotNull);
      expect(metadata[0]['value']['adjustmentTime'], isNotNull);
      expect(metadata[0]['value']['latitude'], isNotNull);
      expect(metadata[0]['value']['longitude'], isNotNull);
    });

    test('should NOT include metadata on Android regardless of server version', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final sutAndroid = BackgroundUploadService(
        mockUploadRepository,
        mockStorageRepository,
        mockLocalAssetRepository,
        mockBackupRepository,
        mockAssetService,
      );
      addTearDown(() => sutAndroid.dispose());

      final assetWithCloudId = LocalAsset(
        id: 'test-asset-id',
        name: 'test.jpg',
        type: AssetType.image,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 2),
        cloudId: 'cloud-id-123',
        latitude: 37.7749,
        longitude: -122.4194,
        playbackStyle: AssetPlaybackStyle.image,
        isEdited: false,
      );

      final mockFile = File('/path/to/test.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(assetWithCloudId.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'test.jpg', isLivePhoto: false));

      final task = await sutAndroid.getUploadTask(assetWithCloudId);

      expect(task, isNotNull);
      expect(task!.fields.containsKey('metadata'), isFalse);
    });

    test('should NOT include metadata when cloudId is null even on iOS with server 2.4+', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final sutWithV24 = BackgroundUploadService(
        mockUploadRepository,
        mockStorageRepository,
        mockLocalAssetRepository,
        mockBackupRepository,
        mockAssetService,
      );
      addTearDown(() => sutWithV24.dispose());

      final assetWithoutCloudId = LocalAsset(
        id: 'test-asset-id',
        name: 'test.jpg',
        type: AssetType.image,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 2),
        cloudId: null, // No cloudId
        playbackStyle: AssetPlaybackStyle.image,
        isEdited: false,
      );

      final mockFile = File('/path/to/test.jpg');

      when(
        () => mockStorageRepository.getFileForAsset(assetWithoutCloudId.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'test.jpg', isLivePhoto: false));

      final task = await sutWithV24.getUploadTask(assetWithoutCloudId);

      expect(task, isNotNull);
      expect(task!.fields.containsKey('metadata'), isFalse);
    });

    test('should include metadata for live photos with cloudId on iOS 2.4+', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final sutWithV24 = BackgroundUploadService(
        mockUploadRepository,
        mockStorageRepository,
        mockLocalAssetRepository,
        mockBackupRepository,
        mockAssetService,
      );
      addTearDown(() => sutWithV24.dispose());

      final assetWithCloudId = LocalAsset(
        id: 'test-livephoto-id',
        name: 'livephoto.heic',
        type: AssetType.image,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 2),
        cloudId: 'cloud-id-livephoto',
        latitude: 37.7749,
        longitude: -122.4194,
        playbackStyle: AssetPlaybackStyle.livePhoto,
        isEdited: false,
      );

      final mockFile = File('/path/to/livephoto.heic');

      when(
        () => mockStorageRepository.getFileForAsset(assetWithCloudId.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'livephoto.heic', isLivePhoto: true));

      final task = await sutWithV24.getLivePhotoUploadTask(assetWithCloudId, 'video-123');

      expect(task, isNotNull);
      expect(task!.fields.containsKey('metadata'), isTrue);
      expect(task.fields['livePhotoVideoId'], equals('video-123'));
      expect(task.fields.containsKey('visibility'), isFalse);

      final metadata = jsonDecode(task.fields['metadata']!) as List;
      expect(metadata, hasLength(1));
      expect(metadata[0]['key'], equals('mobile-app'));
      expect(metadata[0]['value']['iCloudId'], equals('cloud-id-livephoto'));
    });
  });

  group('onUploadStatus', () {
    test('stacks a plain photo after its upload', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'sha');
      final mockFile = File('/path/to/photo.jpg');
      final void Function(TaskStatusUpdate) onStatus = verify(
        () => mockUploadRepository.onUploadStatus = captureAny(),
      ).captured.first;

      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: mockFile, originalFileName: 'photo.jpg', isLivePhoto: false));

      final task = await sut.getUploadTask(asset);
      onStatus(TaskStatusUpdate(task!, TaskStatus.complete, null, '{"id": "remote"}'));

      verify(() => mockAssetService.stackEditedUpload(asset.id, 'remote', 'sha')).called(1);
      verifyNoMoreInteractions(mockAssetService);
    });

    test('stacks the still of a live photo, not its video', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'sha');
      final stillFile = File('/path/to/still.heic');
      final videoFile = File('/path/to/motion.mov');
      final void Function(TaskStatusUpdate) onStatus = verify(
        () => mockUploadRepository.onUploadStatus = captureAny(),
      ).captured.first;

      when(
        () => mockStorageRepository.getMotionFileForAsset(asset),
      ).thenAnswer((_) async => (file: videoFile, originalFileName: 'live.mov', isLivePhoto: true));
      when(
        () => mockStorageRepository.getFileForAsset(asset.id),
      ).thenAnswer((_) async => (file: stillFile, originalFileName: 'live.heic', isLivePhoto: true));
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => null);

      final video = await sut.getUploadTask(asset);
      final still = await sut.getLivePhotoUploadTask(asset, 'video');
      onStatus(TaskStatusUpdate(video!, TaskStatus.complete, null, '{"id": "video"}'));
      onStatus(TaskStatusUpdate(still!, TaskStatus.complete, null, '{"id": "still"}'));

      verify(() => mockAssetService.stackEditedUpload(asset.id, 'still', 'sha')).called(1);
      verifyNoMoreInteractions(mockAssetService);
    });
  });
}
