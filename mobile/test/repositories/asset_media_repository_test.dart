import 'dart:async';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:mocktail/mocktail.dart';
import 'package:path/path.dart' as p;

import '../test_utils.dart';

class _MockNativeSyncApi extends Mock implements NativeSyncApi {}

class _MockPersistentStorage extends Mock implements PersistentStorage {}

class _MockStorageRepository extends Mock implements StorageRepository {}

class _TestAssetMediaRepository extends AssetMediaRepository {
  _TestAssetMediaRepository(super.nativeSyncApi, super.storageRepository, this.shareCall);

  final Completer<List<String>> shareCall;
  final cleanups = <List<FileSystemEntity>>[];
  final cleanupAfterShare = Completer<List<FileSystemEntity>>();

  @override
  Future<void> cleanupTempFiles(List<FileSystemEntity> tempFiles) async {
    cleanups.add(tempFiles);
    if (shareCall.isCompleted) {
      cleanupAfterShare.complete(tempFiles);
    }
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Drift db;
  late StoreService store;
  late Directory tempRoot;
  late _MockStorageRepository storage;
  late _TestAssetMediaRepository repository;
  late List<String> taskDirs;
  late Set<String> failedRemoteIds;
  late Completer<List<String>> shareCall;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    store = await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
    await SettingsRepository.ensureInitialized(db);
    await Store.put(StoreKey.serverEndpoint, 'https://example.com/api');
    // the downloader keeps the storage it gets on its first call. the default one spawns an isolate
    // that needs the real path_provider plugin, so a stub answers init and the resume data cleanup
    final persistentStorage = _MockPersistentStorage();
    when(persistentStorage.initialize).thenAnswer((_) async {});
    when(() => persistentStorage.removeResumeData(any())).thenAnswer((_) async {});
    when(() => persistentStorage.removePausedTask(any())).thenAnswer((_) async {});
    await FileDownloader(persistentStorage: persistentStorage).ready;
  });

  tearDownAll(() async {
    await SettingsRepository.reset();
    await store.dispose();
    await db.close();
  });

  setUp(() {
    tempRoot = Directory.systemTemp.createTempSync('immich-share-test');
    storage = _MockStorageRepository();
    shareCall = Completer<List<String>>();
    repository = _TestAssetMediaRepository(_MockNativeSyncApi(), storage, shareCall);
    taskDirs = [];
    failedRemoteIds = {};

    // keeps every temp path the code asks for inside this test's own folder
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (_) async => tempRoot.path,
    );
    // captures the file paths the share sheet would receive
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('dev.fluttercommunity.plus/share'),
      (call) async {
        final arguments = Map<Object?, Object?>.from(call.arguments as Map);
        shareCall.complete((arguments['paths']! as List).cast<String>());
        return 'success';
      },
    );
    // stands in for a real download, writes the file and reports the task status
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('com.bbflight.background_downloader'),
      (call) async {
        if (call.method != 'enqueue') {
          return true;
        }
        final args = call.arguments! as List;
        final task = Task.createFromJsonString(args.first as String) as DownloadTask;
        final file = File(await task.filePath());
        await file.parent.create(recursive: true);
        await file.writeAsString(task.taskId);
        final status = failedRemoteIds.any((id) => task.taskId.contains('-$id-'))
            ? TaskStatus.failed
            : TaskStatus.complete;
        if (status == TaskStatus.complete) {
          taskDirs.add(file.parent.path);
        }
        FileDownloader().downloaderForTesting.processStatusUpdate(TaskStatusUpdate(task, status));
        return true;
      },
    );
  });

  tearDown(() async {
    if (tempRoot.existsSync()) {
      await tempRoot.delete(recursive: true);
    }
  });

  Future<({int count, List<String> names})> share(
    WidgetTester tester,
    List<BaseAsset> assets, {
    ShareAssetType fileType = ShareAssetType.original,
    Completer<void>? cancelCompleter,
    TargetPlatform platform = TargetPlatform.android,
  }) async {
    debugDefaultTargetPlatformOverride = platform;
    try {
      late BuildContext context;
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (ctx) {
              context = ctx;
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      final result = await tester.runAsync(() async {
        final count = await repository.shareAssets(
          assets,
          context,
          fileType: fileType,
          cancelCompleter: cancelCompleter,
        );
        if (cancelCompleter?.isCompleted ?? false) {
          return (count: count, names: <String>[]);
        }
        final paths = await shareCall.future;
        final cleaned = await repository.cleanupAfterShare.future;
        expect(cleaned.map((entity) => entity.path), taskDirs);
        return (count: count, names: paths.map(p.basename).toList());
      });

      return result!;
    } finally {
      debugDefaultTargetPlatformOverride = null;
    }
  }

  testWidgets('shares sanitized and fallback names then removes task directories', (tester) async {
    final assets = [
      TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'holiday/Photo 1 名字.jpg'),
      TestUtils.createRemoteAsset(id: 'remote-2').copyWith(name: ''),
      TestUtils.createRemoteAsset(id: 'remote-3').copyWith(name: r'\/'),
    ];

    final result = await share(tester, assets);

    expect(result.count, 3);
    expect(result.names, ['holiday_Photo 1 名字.jpg', 'remote-2', 'remote-3']);
  });

  testWidgets('keeps the first copy and uses the first free ordinal for the next', (tester) async {
    final assets = [
      TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG.jpg'),
      TestUtils.createRemoteAsset(id: 'remote-2').copyWith(name: 'IMG (1).jpg'),
      TestUtils.createRemoteAsset(id: 'remote-3').copyWith(name: 'IMG.jpg'),
    ];

    final result = await share(tester, assets);

    expect(result.count, 3);
    expect(result.names, ['IMG.jpg', 'IMG (1).jpg', 'IMG (2).jpg']);
  });

  testWidgets('keeps mixed local and remote paths distinct', (tester) async {
    final localFile = File(p.join(tempRoot.path, 'local', 'IMG.jpg'));
    localFile.parent.createSync();
    localFile.writeAsStringSync('local');
    when(() => storage.getFileForAsset('local-1')).thenAnswer((_) async => localFile);
    final assets = [
      TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG.jpg'),
      TestUtils.createLocalAsset(id: 'local-1').copyWith(name: 'IMG.jpg'),
    ];

    final result = await share(tester, assets);

    expect(result.count, 2);
    expect(result.names, ['IMG (1).jpg', 'IMG.jpg']);
    expect(localFile.existsSync(), isTrue);
  });

  testWidgets('does not count failed downloads when adding ordinals', (tester) async {
    failedRemoteIds.add('remote-1');
    final assets = [
      TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG.jpg'),
      TestUtils.createRemoteAsset(id: 'remote-2').copyWith(name: 'IMG.jpg'),
    ];

    final result = await share(tester, assets);

    expect(result.count, 1);
    expect(result.names, ['IMG.jpg']);
  });

  testWidgets('cleans the current iOS temp file when cancelled during retrieval', (tester) async {
    final cancellation = Completer<void>();
    final localFile = File(p.join(tempRoot.path, 'local', 'IMG.jpg'));
    localFile.parent.createSync();
    localFile.writeAsStringSync('local');
    when(() => storage.getFileForAsset('local-1')).thenAnswer((_) async {
      cancellation.complete();
      return localFile;
    });
    final asset = TestUtils.createLocalAsset(id: 'local-1').copyWith(name: 'IMG.jpg');

    final result = await share(tester, [asset], cancelCompleter: cancellation, platform: TargetPlatform.iOS);

    expect(result.count, 0);
    expect(result.names, isEmpty);
    expect(shareCall.isCompleted, isFalse);
    expect(repository.cleanups.singleOrNull, [localFile]);
  });

  testWidgets('adds an ordinal when preview and video names match', (tester) async {
    final assets = [
      TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG.jpg'),
      TestUtils.createRemoteAsset(id: 'remote-2').copyWith(name: 'IMG-preview.jpg', type: AssetType.video),
    ];

    final result = await share(tester, assets, fileType: ShareAssetType.preview);

    expect(result.count, 2);
    expect(result.names, ['IMG-preview.jpg', 'IMG-preview (1).jpg']);
  });
}
