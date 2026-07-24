import 'dart:async';
import 'dart:io';

import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/platform/connectivity_api.g.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:mocktail/mocktail.dart';

import '../api.mocks.dart';
import '../fixtures/asset.stub.dart';
import '../infrastructure/repository.mock.dart';
import '../mocks/asset_entity.mock.dart';
import '../repository.mocks.dart';

class _Case {
  final String name;
  final List<LocalAsset> assets;
  final List<List<NetworkCapability>> capabilities;
  final BackgroundWorkerResult result;
  final int uploads;
  final bool photos, videos, local, remote, throws;
  final List<UploadResult> uploadResults;

  const _Case(
    this.name,
    this.assets,
    this.capabilities,
    this.result,
    this.uploads, {
    this.photos = true,
    this.videos = true,
    this.local = true,
    this.remote = true,
    this.throws = false,
    this.uploadResults = const [],
  });
}

void main() {
  late ForegroundUploadService sut;
  late MockUploadRepository uploads;
  late MockStorageRepository storage;
  late MockDriftBackupRepository backup;
  late MockConnectivityApi connectivity;
  late MockAssetMediaRepository media;
  late List<Map<String, String>> fields;
  late List<String> names;
  late int uploadCount;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (_) async => 'test',
    );
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
    await SettingsRepository.ensureInitialized(db);
    await Store.put(StoreKey.serverEndpoint, 'http://demo.immich.app');
    await Store.put(StoreKey.deviceId, 'device-id');
    registerFallbackValue(File('file'));
    registerFallbackValue(<String, String>{});
  });

  final photo = LocalAssetStub.image1.copyWith(checksum: 'photo');
  final photo2 = LocalAssetStub.image2.copyWith(checksum: 'photo2');
  final unhashedPhoto = LocalAssetStub.image2;
  final unhashedVideo = LocalAsset(
    id: 'unhashed-video',
    name: 'video.mp4',
    type: AssetType.video,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025, 2),
    playbackStyle: AssetPlaybackStyle.video,
    isEdited: false,
  );
  final video = unhashedVideo.copyWith(id: 'video', checksum: 'video');
  final live = photo.copyWith(playbackStyle: AssetPlaybackStyle.livePhoto);

  void stubUploads(List<UploadResult> results) {
    var index = 0;
    when(
      () => uploads.uploadFile(
        file: any(named: 'file'),
        originalFileName: any(named: 'originalFileName'),
        fields: any(named: 'fields'),
        cancelToken: any(named: 'cancelToken'),
        onProgress: any(named: 'onProgress'),
        logContext: any(named: 'logContext'),
      ),
    ).thenAnswer((invocation) async {
      uploadCount++;
      names.add(invocation.namedArguments[#originalFileName] as String);
      fields.add(Map.of(invocation.namedArguments[#fields] as Map<String, String>));
      return index < results.length ? results[index++] : UploadResult.success(remoteAssetId: 'remote-$uploadCount');
    });
  }

  void stubAsset(LocalAsset asset, {File? file, String? originalName}) {
    final entity = MockAssetEntity();
    final isLive = asset.playbackStyle == AssetPlaybackStyle.livePhoto;
    when(() => entity.isLivePhoto).thenReturn(isLive);
    when(() => storage.getAssetEntityForAsset(asset)).thenAnswer((_) async => entity);
    when(() => storage.isAssetAvailableLocally(asset.id)).thenAnswer((_) async => true);
    when(
      () => storage.getFileForAsset(asset.id),
    ).thenAnswer((_) async => file ?? File('/${asset.id}${asset.isVideo ? '.mp4' : '.jpg'}'));
    when(() => media.getOriginalFilename(asset.id)).thenAnswer((_) async => originalName ?? asset.name);
    if (isLive) {
      when(() => storage.getMotionFileForAsset(asset)).thenAnswer((_) async => File('/motion.mov'));
    }
  }

  void stubCapabilities(List<List<NetworkCapability>> values) {
    var index = 0;
    when(() => connectivity.getCapabilities()).thenAnswer((_) async {
      final value = values[index < values.length ? index : values.length - 1];
      index++;
      return value;
    });
  }

  setUp(() {
    uploads = MockUploadRepository();
    storage = MockStorageRepository();
    backup = MockDriftBackupRepository();
    connectivity = MockConnectivityApi();
    media = MockAssetMediaRepository();
    sut = ForegroundUploadService(uploads, storage, backup, connectivity, media);
    fields = [];
    names = [];
    uploadCount = 0;
    when(storage.clearCache).thenAnswer((_) async {});
    stubUploads(const []);
  });

  group('uploadSingleAsset', () {
    test('uploads live motion hidden and keeps the still visible', () async {
      stubAsset(live, file: File('/still.heic'), originalName: 'live.heic');
      await sut.uploadSingleAsset(live, null, callbacks: const UploadCallbacks());
      expect(fields, hasLength(2));
      expect(fields.first['visibility'], 'hidden');
      expect(fields.last['visibility'], isNull);
      expect(fields.last['livePhotoVideoId'], 'remote-1');
    });

    test('does not set visibility for a regular photo', () async {
      stubAsset(photo);
      await sut.uploadSingleAsset(photo, null, callbacks: const UploadCallbacks());
      expect(fields.single['visibility'], isNull);
    });

    final filenameCases = [
      (File('/IMG_6499.jpg'), 'IMG_6499.dng', 'IMG_6499.jpg'),
      (File('/IMG_5210.dng'), 'IMG_5210.dng', 'IMG_5210.dng'),
      (File('/DJI_0001'), 'DJI_0001', 'DJI_0001.jpg'),
    ];
    for (final row in filenameCases) {
      test('uses ${row.$3}', () async {
        stubAsset(photo, file: row.$1, originalName: row.$2);
        await sut.uploadSingleAsset(photo, null, callbacks: const UploadCallbacks());
        expect(names.single, row.$3);
      });
    }
  });

  group('background matrix', () {
    const offline = <NetworkCapability>[];
    const metered = [NetworkCapability.cellular];
    const unmetered = [NetworkCapability.wifi, NetworkCapability.unmetered];
    const none = BackgroundWorkerResult.none;
    const connected = BackgroundWorkerResult.connected;
    const wifi = BackgroundWorkerResult.unmetered;
    const unchanged = BackgroundWorkerResult.unchanged;
    final off = [offline];
    final met = [metered];
    final un = [unmetered];
    final unToMet = [unmetered, metered];
    final metToUn = [metered, unmetered];
    final p = [photo];
    final v = [video];
    final pv = [photo, video];
    final vp = [video, photo];
    final vpp = [video, photo, photo2];
    final lv = [live, video];
    final liveCost = [unmetered, ...unToMet];
    final quota = [UploadResult.error(errorMessage: 'Quota has been exceeded!')];
    final failed = [UploadResult.error(errorMessage: 'network')];
    final recovered = [...failed, UploadResult.success(remoteAssetId: 'remote-2')];
    final cancelled = [UploadResult.cancelled()];
    final matrix = [
      _Case('authoritative empty', [], met, none, 0),
      _Case('remote fail offline allowed', p, off, connected, 0, remote: false),
      _Case('remote fail offline gated', v, off, wifi, 0, videos: false, remote: false),
      _Case('offline mixed gated first', vp, off, connected, 0, videos: false),
      _Case('metered allowed complete', p, met, none, 1),
      _Case('metered gated only', v, met, wifi, 0, videos: false),
      _Case('metered mixed allowed first', pv, met, wifi, 1, videos: false),
      _Case('metered mixed early stop gated first', vpp, met, connected, 1, videos: false, uploadResults: quota),
      _Case('unmetered complete', vp, un, none, 2, photos: false, videos: false),
      _Case('apparent unmetered failure', vp, un, connected, 2, videos: false, uploadResults: recovered),
      _Case('cancelled allowed remains', pv, met, connected, 1, videos: false, uploadResults: cancelled),
      _Case('classifier exception both sources', p, met, unchanged, 0, throws: true),
      _Case('local sync error both sources', v, met, unchanged, 0, local: false),
      _Case('hash timeout unhashed allowed', [photo, unhashedPhoto], met, connected, 1),
      _Case('hash timeout unhashed gated', [unhashedVideo], met, wifi, 0, videos: false),
      _Case('hash timeout authoritative empty', [], off, none, 0),
      _Case('unmetered to metered gated only', v, unToMet, wifi, 0, videos: false),
      _Case('unmetered to metered mixed', vp, unToMet, wifi, 1, videos: false),
      _Case('live photo part cost change', lv, liveCost, wifi, 2, photos: false, uploadResults: recovered),
      _Case('metered to unmetered later gated', pv, metToUn, none, 2, videos: false),
    ];

    for (final row in matrix) {
      test(row.name, () async {
        await SettingsRepository.instance.write(.backupUseCellularForPhotos, row.photos);
        await SettingsRepository.instance.write(.backupUseCellularForVideos, row.videos);
        Future<List<LocalAsset>> query() => backup.getCandidates('user', onlyHashed: false);
        if (row.throws) {
          when(query).thenThrow(StateError('scan'));
        } else {
          when(query).thenAnswer((_) async => row.assets.toList());
        }
        for (final asset in row.assets) {
          stubAsset(asset);
        }
        stubCapabilities(row.capabilities);
        if (row.uploadResults.isNotEmpty) {
          stubUploads(row.uploadResults);
        }

        final result = await sut.uploadCandidatesInBackground(
          'user',
          Completer<void>(),
          backupEnabled: true,
          localSyncCompleted: row.local,
          remoteSyncCompleted: row.remote,
        );

        expect(result, row.result);
        expect(uploadCount, row.uploads);
        if (!row.local) {
          verifyNever(query);
        } else {
          verify(query).called(1);
        }
      });
    }
  });
}
