import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/offline_album.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_file.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../medium/repository_context.dart';

class MockFileDownloader extends Mock implements FileDownloader {}

void main() {
  late MediumRepositoryContext ctx;
  late DriftOfflineAlbumRepository repository;
  late MockFileDownloader mockDownloader;
  late OfflineAlbumService sut;
  late Directory tempDir;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    tempDir = await Directory.systemTemp.createTemp('offline_album_service_test');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (MethodCall methodCall) async => tempDir.path,
    );

    // Store and settings singletons are bound to a long-lived database that
    // outlives the per-test contexts
    final storeDb = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(storeDb));
    await SettingsRepository.ensureInitialized(storeDb);
    await Store.put(StoreKey.serverEndpoint, 'http://test-server.com/api');
  });

  tearDownAll(() async {
    await tempDir.delete(recursive: true);
  });

  setUp(() async {
    ctx = MediumRepositoryContext();
    await OfflineFileRegistry.ensureInitialized(ctx.db);

    repository = DriftOfflineAlbumRepository(ctx.db);
    mockDownloader = MockFileDownloader();
    when(
      () => mockDownloader.registerCallbacks(group: any(named: 'group'), taskStatusCallback: any(named: 'taskStatusCallback')),
    ).thenReturn(mockDownloader);
    when(() => mockDownloader.enqueueAll(any())).thenAnswer(
      (invocation) async => List.filled((invocation.positionalArguments.first as List).length, true),
    );
    when(() => mockDownloader.allTasks(group: any(named: 'group'))).thenAnswer((_) async => []);
    when(() => mockDownloader.cancelTaskWithId(any())).thenAnswer((_) async => true);

    sut = OfflineAlbumService(repository, downloader: mockDownloader);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  List<DownloadTask> enqueuedTasks() {
    final captured = verify(() => mockDownloader.enqueueAll(captureAny())).captured;
    return captured.expand((tasks) => tasks as List<DownloadTask>).toList();
  }

  group('enable', () {
    test('marks the album offline and enqueues original and thumbnail downloads', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);

      final enqueued = await sut.enable(album.id);

      expect(await repository.isAlbumOffline(album.id), isTrue);
      expect(enqueued, 2);

      final tasks = enqueuedTasks();
      expect(tasks, hasLength(2));

      final original = tasks.singleWhere((task) => task.taskId == 'offline_original_${asset.id}');
      expect(original.url, 'http://test-server.com/api/assets/${asset.id}/original?edited=true');
      expect(original.filename, '${asset.id}.jpg');
      expect(original.directory, kOfflineAssetsDirectory);
      expect(original.baseDirectory, BaseDirectory.applicationSupport);
      expect(original.group, kDownloadGroupOfflineAsset);

      final thumbnail = tasks.singleWhere((task) => task.taskId == 'offline_thumb_${asset.id}');
      expect(thumbnail.filename, '${asset.id}.thumb.webp');
      expect(thumbnail.url, startsWith('http://test-server.com/api/assets/${asset.id}/thumbnail'));
    });

    test('enqueues the motion photo video as an additional download', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id, livePhotoVideoId: 'live-video-id');
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);

      final enqueued = await sut.enable(album.id);

      expect(enqueued, 3);

      final tasks = enqueuedTasks();
      final liveVideo = tasks.singleWhere((task) => task.taskId == 'offline_original_live-video-id');
      expect(liveVideo.url, 'http://test-server.com/api/assets/live-video-id/original?edited=true');
      expect(liveVideo.filename, 'live-video-id.mov');
    });

    test('does not re-download assets that are already downloaded', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);
      await repository.setOriginalDownloaded(asset.id, '${asset.id}.jpg', 1);
      await repository.setThumbnailDownloaded(asset.id, '${asset.id}.thumb.webp');

      final enqueued = await sut.enable(album.id);

      expect(enqueued, 0);
      verifyNever(() => mockDownloader.enqueueAll(any()));
    });
  });

  group('disable', () {
    test('removes downloaded rows that no other offline album needs', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);
      await repository.addAlbum(album.id);
      await repository.setOriginalDownloaded(asset.id, '${asset.id}.jpg', 1);

      await sut.disable(album.id);

      expect(await repository.isAlbumOffline(album.id), isFalse);
      expect(await repository.getDownloadedAssetIds(), isEmpty);
      verify(() => mockDownloader.cancelTaskWithId('offline_original_${asset.id}')).called(1);
    });

    test('keeps downloads that are still required by another offline album', () async {
      final user = await ctx.newUser();
      final album1 = await ctx.newRemoteAlbum(ownerId: user.id);
      final album2 = await ctx.newRemoteAlbum(ownerId: user.id);
      final shared = await ctx.newRemoteAsset(ownerId: user.id);
      final only1 = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: shared.id);
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: shared.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: only1.id);
      await repository.addAlbum(album1.id);
      await repository.addAlbum(album2.id);
      await repository.setOriginalDownloaded(shared.id, '${shared.id}.jpg', 1);
      await repository.setOriginalDownloaded(only1.id, '${only1.id}.jpg', 1);

      await sut.disable(album1.id);

      expect(await repository.getDownloadedAssetIds(), {shared.id});
    });
  });

  group('download status callback', () {
    test('records the original file once the download completes', () async {
      final callback =
          verify(
                () => mockDownloader.registerCallbacks(
                  group: kDownloadGroupOfflineAsset,
                  taskStatusCallback: captureAny(named: 'taskStatusCallback'),
                ),
              ).captured.single
              as TaskStatusCallback;

      final task = DownloadTask(
        taskId: 'offline_original_asset-1',
        url: 'http://test-server.com/api/assets/asset-1/original',
        filename: 'asset-1.jpg',
        directory: kOfflineAssetsDirectory,
        baseDirectory: BaseDirectory.applicationSupport,
        group: kDownloadGroupOfflineAsset,
        metaData: const OfflineDownloadMetadata(assetId: 'asset-1', kind: OfflineDownloadKind.original).encode(),
      );

      final file = File(await task.filePath());
      await file.create(recursive: true);
      await file.writeAsBytes(List.filled(42, 0));

      callback(TaskStatusUpdate(task, TaskStatus.complete));
      await pumpEventQueue();

      final rows = await ctx.db.offlineAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.assetId, 'asset-1');
      expect(rows.first.fileName, 'asset-1.jpg');
      expect(rows.first.fileSize, 42);
      expect(OfflineFileRegistry.instance.hasOriginal('asset-1'), isTrue);
    });

    test('records the thumbnail once the download completes', () async {
      final callback =
          verify(
                () => mockDownloader.registerCallbacks(
                  group: kDownloadGroupOfflineAsset,
                  taskStatusCallback: captureAny(named: 'taskStatusCallback'),
                ),
              ).captured.single
              as TaskStatusCallback;

      final task = DownloadTask(
        taskId: 'offline_thumb_asset-1',
        url: 'http://test-server.com/api/assets/asset-1/thumbnail',
        filename: 'asset-1.thumb.webp',
        directory: kOfflineAssetsDirectory,
        baseDirectory: BaseDirectory.applicationSupport,
        group: kDownloadGroupOfflineAsset,
        metaData: const OfflineDownloadMetadata(assetId: 'asset-1', kind: OfflineDownloadKind.thumbnail).encode(),
      );

      callback(TaskStatusUpdate(task, TaskStatus.complete));
      await pumpEventQueue();

      final rows = await ctx.db.offlineAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.thumbFileName, 'asset-1.thumb.webp');
      expect(rows.first.fileName, isNull);
      expect(OfflineFileRegistry.instance.hasThumbnail('asset-1'), isTrue);
    });

    test('ignores failed downloads', () async {
      final callback =
          verify(
                () => mockDownloader.registerCallbacks(
                  group: kDownloadGroupOfflineAsset,
                  taskStatusCallback: captureAny(named: 'taskStatusCallback'),
                ),
              ).captured.single
              as TaskStatusCallback;

      final task = DownloadTask(
        taskId: 'offline_original_asset-1',
        url: 'http://test-server.com/api/assets/asset-1/original',
        filename: 'asset-1.jpg',
        group: kDownloadGroupOfflineAsset,
        metaData: const OfflineDownloadMetadata(assetId: 'asset-1', kind: OfflineDownloadKind.original).encode(),
      );

      callback(TaskStatusUpdate(task, TaskStatus.failed));
      await pumpEventQueue();

      expect(await ctx.db.offlineAssetEntity.select().get(), isEmpty);
    });
  });
}
