import 'dart:async';
import 'dart:io';

import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/connectivity_api.g.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:mocktail/mocktail.dart';

import '../api.mocks.dart';
import '../domain/service.mock.dart';
import '../infrastructure/repository.mock.dart';
import '../mocks/asset_entity.mock.dart';
import '../repository.mocks.dart';

void main() {
  late ForegroundUploadService sut;
  late MockUploadRepository mockUpload;
  late MockStorageRepository mockStorage;
  late MockDriftBackupRepository mockBackup;
  late MockConnectivityApi mockConnectivity;
  late MockAssetMediaRepository mockAssetMedia;
  late MockNativeSyncApi mockNativeApi;
  late MockDriftLocalAssetRepository mockLocalAsset;
  late MockEditRevertService mockEditRevert;
  late MockDriftStackRepository mockStack;
  late Drift db;
  late Directory tmp;

  final edited = LocalAsset(
    id: 'edited-1',
    name: 'edited-1.jpg',
    type: AssetType.image,
    createdAt: DateTime(2025, 1, 1, 12),
    updatedAt: DateTime(2025, 1, 1, 12),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
    checksum: 'edited-sha1',
    // 30s past createdAt → the edit gate fires.
    adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30),
  );

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    registerFallbackValue(edited);
    registerFallbackValue(File('/tmp/fallback'));
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (_) async => 'test',
    );
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
    await SettingsRepository.ensureInitialized(db);
    await Store.put(StoreKey.serverEndpoint, 'http://test-server.com');
    await Store.put(StoreKey.deviceId, 'test-device-id');
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
  });

  tearDownAll(() {
    debugDefaultTargetPlatformOverride = null;
  });

  setUp(() async {
    mockUpload = MockUploadRepository();
    mockStorage = MockStorageRepository();
    mockBackup = MockDriftBackupRepository();
    mockConnectivity = MockConnectivityApi();
    mockAssetMedia = MockAssetMediaRepository();
    mockNativeApi = MockNativeSyncApi();
    mockLocalAsset = MockDriftLocalAssetRepository();
    mockEditRevert = MockEditRevertService();
    mockStack = MockDriftStackRepository();

    sut = ForegroundUploadService(
      mockUpload,
      mockStorage,
      mockBackup,
      mockConnectivity,
      mockAssetMedia,
      mockNativeApi,
      mockLocalAsset,
      mockEditRevert,
      mockStack,
    );

    tmp = await Directory.systemTemp.createTemp('fg_upload_test');
    final assetFile = File('${tmp.path}/edited-1.jpg')..writeAsStringSync('edit-bytes');
    final baseFile = File('${tmp.path}/edited-1_base.jpg')..writeAsStringSync('base-bytes');

    when(() => mockStorage.clearCache()).thenAnswer((_) async {});
    when(() => mockConnectivity.getCapabilities()).thenAnswer((_) async => [NetworkCapability.unmetered]);

    final entity = MockAssetEntity();
    when(() => entity.isLivePhoto).thenReturn(false);
    when(() => mockStorage.getAssetEntityForAsset(any())).thenAnswer((_) async => entity);
    when(() => mockStorage.isAssetAvailableLocally(any())).thenAnswer((_) async => true);
    when(() => mockStorage.getFileForAsset(any())).thenAnswer((_) async => assetFile);
    when(() => mockAssetMedia.getOriginalFilename(any())).thenAnswer((_) async => 'edited-1.jpg');

    // Not a revert; prior is alive; the edit gate fires with a real base file.
    when(() => mockEditRevert.tryHandleRevert(any())).thenAnswer((_) async => null);
    when(() => mockStack.priorState(any())).thenAnswer((_) async => PriorState.live);
    when(
      () => mockNativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
    ).thenAnswer((_) async => BaseResource(path: baseFile.path, sha1: 'base-sha1'));
    when(
      () => mockLocalAsset.markSynced(
        any(),
        priorRemoteId: any(named: 'priorRemoteId'),
        syncedChecksum: any(named: 'syncedChecksum'),
      ),
    ).thenAnswer((_) async {});
  });

  tearDown(() async {
    if (tmp.existsSync()) {
      tmp.deleteSync(recursive: true);
    }
  });

  group('revert short-circuit', () {
    test('reports the flipped-to base id and skips the upload', () async {
      final reverted = edited.copyWith(priorRemoteId: 'prior-1', syncedChecksum: 'old-sha1');
      // The service flipped the cover to a base that isn't the stale pre-flip prior.
      when(() => mockEditRevert.tryHandleRevert(any())).thenAnswer((_) async => 'base-flip-1');

      final successes = <String>[];
      await sut.uploadManual([
        reverted,
      ], callbacks: UploadCallbacks(onSuccess: (_, remoteId) => successes.add(remoteId)));

      // onSuccess carries the id the service flipped to, not asset.priorRemoteId.
      expect(successes, ['base-flip-1']);
      verifyNever(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      );
      // The revert service does its own bookkeeping; the upload path stamps nothing.
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });
  });

  group('edit pair base failure', () {
    test('does not upload the edit or mark synced when the base upload fails', () async {
      // Base upload fails; the edit upload should never run.
      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer((_) async => UploadResult.error(errorMessage: 'boom', statusCode: 500));

      await sut.uploadManual([edited]);

      // Exactly one upload attempt (the base). The edit must not be uploaded,
      // and the asset must stay a candidate (no markSynced).
      verify(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: 'baseResource[edited-1]',
        ),
      ).called(1);
      verifyNever(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: 'asset[edited-1]',
        ),
      );
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('uploads the edit with stackParentId and marks synced when the base succeeds', () async {
      var uploadCount = 0;
      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer((invocation) async {
        uploadCount++;
        // base first → base-remote, then the edit → edit-remote.
        return UploadResult.success(remoteAssetId: uploadCount == 1 ? 'base-remote' : 'edit-remote');
      });

      await sut.uploadManual([edited]);

      // The edit upload carries the base's id as stackParentId.
      final captured =
          verify(
                () => mockUpload.uploadFile(
                  file: any(named: 'file'),
                  originalFileName: any(named: 'originalFileName'),
                  fields: captureAny(named: 'fields'),
                  cancelToken: any(named: 'cancelToken'),
                  onProgress: any(named: 'onProgress'),
                  logContext: 'asset[edited-1]',
                ),
              ).captured.single
              as Map<String, String>;
      expect(captured['stackParentId'], 'base-remote');

      verify(
        () => mockLocalAsset.markSynced('edited-1', priorRemoteId: 'edit-remote', syncedChecksum: 'edited-sha1'),
      ).called(1);
    });
  });

  group('dead stack parent', () {
    // Stamped prior is live in the local db, so the edit absorbs into it — but the
    // server may have already lost the row, answering 400 on the stack attempt.
    final stamped = edited.copyWith(priorRemoteId: 'prior-1', syncedChecksum: 'old-sha1');

    setUp(() {
      when(() => mockStack.priorState('prior-1')).thenAnswer((_) async => PriorState.live);
      when(() => mockLocalAsset.clearSyncStamps(any())).thenAnswer((_) async {});
    });

    test('a stale-prior 400 on the main upload clears the sync stamps', () async {
      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer(
        (_) async => UploadResult.error(
          errorMessage: 'Bad request: Cannot stack onto a trashed or missing asset',
          statusCode: 400,
        ),
      );

      await sut.uploadManual([stamped]);

      verify(() => mockLocalAsset.clearSyncStamps('edited-1')).called(1);
    });

    test('an unrelated upload error leaves the stamps alone', () async {
      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer((_) async => UploadResult.error(errorMessage: 'boom', statusCode: 500));

      await sut.uploadManual([stamped]);

      verifyNever(() => mockLocalAsset.clearSyncStamps(any()));
    });
  });

  group('android', () {
    test('a successful upload does not stamp the sync columns', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.iOS);

      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer((_) async => UploadResult.success(remoteAssetId: 'remote-1'));

      final successes = <String>[];
      await sut.uploadManual([edited], callbacks: UploadCallbacks(onSuccess: (_, remoteId) => successes.add(remoteId)));

      expect(successes, ['remote-1']);
      // Edit stacking is iOS-only: no base read, no stamps.
      verifyNever(() => mockNativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });
  });

  group('live photo edit pair', () {
    final liveAsset = LocalAsset(
      id: 'live-1',
      name: 'live-1.heic',
      type: AssetType.image,
      createdAt: DateTime(2025, 1, 1, 12),
      updatedAt: DateTime(2025, 1, 1, 12),
      playbackStyle: AssetPlaybackStyle.livePhoto,
      isEdited: false,
      checksum: 'edit-still-sha1',
      // cloudId so the metadata field appears on the still uploads.
      cloudId: 'cloud-live-1',
      adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30),
    );

    late File baseStillFile;
    late File baseVideoFile;
    late List<String> uploadOrder;
    late Map<String, Map<String, String>> fieldsByHop;
    late List<String> errors;

    setUp(() {
      final editStillFile = File('${tmp.path}/live-1.heic')..writeAsStringSync('edit-still-bytes');
      final editMotionFile = File('${tmp.path}/live-1_motion.mov')..writeAsStringSync('edit-motion-bytes');
      baseStillFile = File('${tmp.path}/live-1_base.heic')..writeAsStringSync('base-still-bytes');
      baseVideoFile = File('${tmp.path}/live-1_base.mov')..writeAsStringSync('base-video-bytes');

      uploadOrder = [];
      fieldsByHop = {};
      errors = [];

      final entity = MockAssetEntity();
      when(() => entity.isLivePhoto).thenReturn(true);
      when(() => mockStorage.getAssetEntityForAsset(any())).thenAnswer((_) async => entity);
      when(() => mockStorage.getFileForAsset(any())).thenAnswer((_) async => editStillFile);
      when(() => mockStorage.getMotionFileForAsset(any())).thenAnswer((_) async => editMotionFile);
      when(() => mockAssetMedia.getOriginalFilename(any())).thenAnswer((_) async => 'live-1.heic');
      when(
        () => mockNativeApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer(
        (_) async => BaseLivePhoto(
          still: BaseResource(path: baseStillFile.path, sha1: 'original-sha1'),
          video: BaseResource(path: baseVideoFile.path, sha1: 'original-video-sha1'),
        ),
      );
    });

    // Sequences uploads by logContext: records order + a snapshot of the fields,
    // succeeds with '<hop>-remote' unless the hop has an override result.
    void stubUploads({Map<String, UploadResult> overrides = const {}}) {
      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer((invocation) async {
        final logContext = invocation.namedArguments[#logContext] as String;
        final hop = logContext.split('[').first;
        uploadOrder.add(logContext);
        fieldsByHop[hop] = Map.of(invocation.namedArguments[#fields] as Map<String, String>);
        return overrides[hop] ?? UploadResult.success(remoteAssetId: '$hop-remote');
      });
    }

    UploadCallbacks callbacks() => UploadCallbacks(onError: (_, message) => errors.add(message));

    test('uploads the base pair, then motion, then the edit with isolated fields', () async {
      stubUploads();

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, [
        'baseLiveVideo[live-1]',
        'baseLiveStill[live-1]',
        'livePhotoVideo[live-1]',
        'asset[live-1]',
      ]);

      // Both motion videos upload hidden; both stills stay on the timeline. The
      // edit's motion never inherits the stack parent resolved just before it.
      final editVideoFields = fieldsByHop['livePhotoVideo']!;
      expect(editVideoFields['visibility'], 'hidden');
      expect(editVideoFields.containsKey('stackParentId'), isFalse);
      final baseVideoFields = fieldsByHop['baseLiveVideo']!;
      expect(baseVideoFields['visibility'], 'hidden');
      expect(baseVideoFields.containsKey('livePhotoVideoId'), isFalse);
      expect(baseVideoFields.containsKey('stackParentId'), isFalse);

      // The base still pairs with the base video and stays free of the edit's timestamp.
      final baseStillFields = fieldsByHop['baseLiveStill']!;
      expect(baseStillFields['livePhotoVideoId'], 'baseLiveVideo-remote');
      expect(baseStillFields.containsKey('stackParentId'), isFalse);
      expect(baseStillFields.containsKey('visibility'), isFalse);
      expect(baseStillFields['metadata'], isNotNull);
      expect(baseStillFields['metadata'], isNot(contains('adjustmentTime')));

      // The edit keeps its own motion id, stacks onto the base still, carries the edit time, stays visible.
      final mainFields = fieldsByHop['asset']!;
      expect(mainFields['livePhotoVideoId'], 'livePhotoVideo-remote');
      expect(mainFields['stackParentId'], 'baseLiveStill-remote');
      expect(mainFields.containsKey('visibility'), isFalse);
      expect(mainFields['metadata'], contains('adjustmentTime'));

      verifyInOrder([
        () => mockLocalAsset.markSynced('live-1', priorRemoteId: 'baseLiveStill-remote', syncedChecksum: null),
        () => mockLocalAsset.markSynced('live-1', priorRemoteId: 'asset-remote', syncedChecksum: 'edit-still-sha1'),
      ]);
      expect(errors, isEmpty);
      expect(baseStillFile.existsSync(), isFalse);
      expect(baseVideoFile.existsSync(), isFalse);
    });

    test('base video failure stops the chain and keeps the pair a candidate', () async {
      stubUploads(overrides: {'baseLiveVideo': UploadResult.error(errorMessage: 'base video boom', statusCode: 500)});

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      // The pair resolves before any file is materialized, so a failed base burns
      // neither a motion upload nor a file read.
      expect(uploadOrder, ['baseLiveVideo[live-1]']);
      verifyNever(() => mockStorage.isAssetAvailableLocally(any()));
      verifyNever(() => mockStorage.getFileForAsset(any()));
      verifyNever(() => mockStorage.getMotionFileForAsset(any()));
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
      expect(errors, ['base video boom']);
      expect(baseStillFile.existsSync(), isFalse);
      expect(baseVideoFile.existsSync(), isFalse);
    });

    test('base still failure after video success stops the chain', () async {
      stubUploads(overrides: {'baseLiveStill': UploadResult.error(errorMessage: 'base still boom', statusCode: 500)});

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, ['baseLiveVideo[live-1]', 'baseLiveStill[live-1]']);
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
      expect(errors, ['base still boom']);
      expect(baseStillFile.existsSync(), isFalse);
      expect(baseVideoFile.existsSync(), isFalse);
    });

    test('degrades to a still-only base when the original has no paired video', () async {
      when(
        () => mockNativeApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer(
        (_) async => BaseLivePhoto(
          still: BaseResource(path: baseStillFile.path, sha1: 'original-sha1'),
        ),
      );
      stubUploads();

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, ['baseLiveStill[live-1]', 'livePhotoVideo[live-1]', 'asset[live-1]']);

      final baseStillFields = fieldsByHop['baseLiveStill']!;
      expect(baseStillFields.containsKey('livePhotoVideoId'), isFalse);

      // The stack still forms onto the lone base still.
      expect(fieldsByHop['asset']!['stackParentId'], 'baseLiveStill-remote');
      verify(
        () => mockLocalAsset.markSynced('live-1', priorRemoteId: 'asset-remote', syncedChecksum: 'edit-still-sha1'),
      ).called(1);
      expect(errors, isEmpty);
      expect(baseStillFile.existsSync(), isFalse);
    });

    test('cancellation on the base hop aborts the run without an error callback', () async {
      stubUploads(overrides: {'baseLiveVideo': UploadResult.cancelled()});

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, ['baseLiveVideo[live-1]']);
      expect(sut.shouldAbortUpload, isTrue);
      expect(errors, isEmpty);
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('quota error on the base hop aborts the run and surfaces the error', () async {
      stubUploads(
        overrides: {'baseLiveVideo': UploadResult.error(errorMessage: 'Quota has been exceeded!', statusCode: 403)},
      );

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, ['baseLiveVideo[live-1]']);
      expect(sut.shouldAbortUpload, isTrue);
      expect(errors, ['Quota has been exceeded!']);
    });

    test('a trashed prior defers a manual upload, telling the user and materializing nothing', () async {
      stubUploads();
      when(() => mockStack.priorState('prior-1')).thenAnswer((_) async => PriorState.trashed);
      final deferred = liveAsset.copyWith(priorRemoteId: 'prior-1', syncedChecksum: 'stale-sha1');

      await sut.uploadManual([deferred], callbacks: callbacks());

      expect(uploadOrder, isEmpty);
      // No localization in tests, so the raw key comes through.
      expect(errors, ['upload_deferred_edit_pair']);
      expect(sut.shouldAbortUpload, isFalse);
      // Resolution happens before any file work, so a defer downloads nothing.
      verifyNever(() => mockStorage.isAssetAvailableLocally(any()));
      verifyNever(() => mockStorage.getFileForAsset(any()));
      verifyNever(() => mockStorage.getMotionFileForAsset(any()));
      verifyNever(() => mockStorage.loadFileFromCloud(any(), progressHandler: any(named: 'progressHandler')));
      verifyNever(() => mockStorage.loadMotionFileFromCloud(any(), progressHandler: any(named: 'progressHandler')));
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('the same defer stays silent on the auto-candidates path', () async {
      stubUploads();
      when(() => mockStack.priorState('prior-1')).thenAnswer((_) async => PriorState.trashed);
      final deferred = liveAsset.copyWith(priorRemoteId: 'prior-1', syncedChecksum: 'stale-sha1');
      when(() => mockBackup.getCandidates(any())).thenAnswer((_) async => [deferred]);

      await sut.uploadCandidates('user-1', Completer<void>(), callbacks: callbacks());

      expect(uploadOrder, isEmpty);
      expect(errors, isEmpty);
      expect(sut.shouldAbortUpload, isFalse);
      verifyNever(() => mockStorage.isAssetAvailableLocally(any()));
      verifyNever(() => mockStorage.getFileForAsset(any()));
    });

    test('cancellation on the motion hop aborts before the main upload', () async {
      stubUploads(overrides: {'livePhotoVideo': UploadResult.cancelled()});

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, ['baseLiveVideo[live-1]', 'baseLiveStill[live-1]', 'livePhotoVideo[live-1]']);
      expect(sut.shouldAbortUpload, isTrue);
      expect(errors, isEmpty);
      // Only the base stamp lands; the edit never marks synced.
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: 'edit-still-sha1',
        ),
      );
    });

    test('quota error on the motion hop aborts and surfaces the error', () async {
      stubUploads(
        overrides: {'livePhotoVideo': UploadResult.error(errorMessage: 'Quota has been exceeded!', statusCode: 403)},
      );

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, ['baseLiveVideo[live-1]', 'baseLiveStill[live-1]', 'livePhotoVideo[live-1]']);
      expect(sut.shouldAbortUpload, isTrue);
      expect(errors, ['Quota has been exceeded!']);
    });

    test('a non-quota motion failure falls through to a main upload without livePhotoVideoId', () async {
      stubUploads(overrides: {'livePhotoVideo': UploadResult.error(errorMessage: 'motion boom', statusCode: 500)});

      await sut.uploadManual([liveAsset], callbacks: callbacks());

      expect(uploadOrder, [
        'baseLiveVideo[live-1]',
        'baseLiveStill[live-1]',
        'livePhotoVideo[live-1]',
        'asset[live-1]',
      ]);
      expect(sut.shouldAbortUpload, isFalse);
      expect(errors, isEmpty);

      final mainFields = fieldsByHop['asset']!;
      expect(mainFields.containsKey('livePhotoVideoId'), isFalse);
      expect(mainFields['stackParentId'], 'baseLiveStill-remote');
      verify(
        () => mockLocalAsset.markSynced('live-1', priorRemoteId: 'asset-remote', syncedChecksum: 'edit-still-sha1'),
      ).called(1);
    });
  });

  group('burst member', () {
    // A non-representative burst frame: photo_manager can't resolve it, so it
    // streams the natively-read rendition and stacks under the rep's anchor.
    final member = LocalAsset(
      id: 'member-1',
      name: 'member-1.heic',
      type: AssetType.image,
      createdAt: DateTime(2025, 1, 1, 12),
      updatedAt: DateTime(2025, 1, 1, 12),
      playbackStyle: AssetPlaybackStyle.image,
      isEdited: false,
      checksum: 'member-sha1',
      burstId: 'burst-1',
    );

    late File memberFile;

    UploadResult stubbedResult = UploadResult.success(remoteAssetId: 'member-remote');

    setUp(() {
      stubbedResult = UploadResult.success(remoteAssetId: 'member-remote');
      memberFile = File('${tmp.path}/member-1.heic')..writeAsStringSync('member-bytes');
      when(
        () => mockNativeApi.getCurrentResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: memberFile.path, sha1: 'member-sha1'));
      when(() => mockAssetMedia.getOriginalFilename(any())).thenAnswer((_) async => 'member-1.heic');
      when(() => mockLocalAsset.burstHasRepresentative(any())).thenAnswer((_) async => false);
      when(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      ).thenAnswer((_) async => stubbedResult);
    });

    Map<String, String> capturedFields() =>
        verify(
              () => mockUpload.uploadFile(
                file: any(named: 'file'),
                originalFileName: any(named: 'originalFileName'),
                fields: captureAny(named: 'fields'),
                cancelToken: any(named: 'cancelToken'),
                onProgress: any(named: 'onProgress'),
                logContext: any(named: 'logContext'),
              ),
            ).captured.single
            as Map<String, String>;

    test('stacks under the anchor with keepPrimary and marks synced', () async {
      when(
        () => mockLocalAsset.getBurstParentRemoteId(any(), ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => 'anchor-remote');

      final successes = <String>[];
      await sut.uploadManual([member], callbacks: UploadCallbacks(onSuccess: (_, remoteId) => successes.add(remoteId)));

      final fields = capturedFields();
      expect(fields['stackParentId'], 'anchor-remote');
      expect(fields['keepPrimary'], 'true');
      expect(successes, ['member-remote']);
      verify(
        () => mockLocalAsset.markSynced('member-1', priorRemoteId: 'member-remote', syncedChecksum: 'member-sha1'),
      ).called(1);
    });

    test('gates (no upload) when the rep exists but has not uploaded yet', () async {
      when(
        () => mockLocalAsset.getBurstParentRemoteId(any(), ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => null);
      when(() => mockLocalAsset.burstHasRepresentative(any())).thenAnswer((_) async => true);

      await sut.uploadManual([member]);

      verifyNever(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      );
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('uploads standalone (no stack fields) for a rep-less group', () async {
      // No anchor and no representative (Keep Everything / re-pick): never gate,
      // upload the frame on its own.
      when(
        () => mockLocalAsset.getBurstParentRemoteId(any(), ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => null);
      when(() => mockLocalAsset.burstHasRepresentative(any())).thenAnswer((_) async => false);

      final successes = <String>[];
      await sut.uploadManual([member], callbacks: UploadCallbacks(onSuccess: (_, remoteId) => successes.add(remoteId)));

      final fields = capturedFields();
      expect(fields.containsKey('stackParentId'), isFalse);
      expect(fields.containsKey('keepPrimary'), isFalse);
      expect(successes, ['member-remote']);
    });

    test('reports an error and skips the upload when the rendition is gone', () async {
      when(
        () => mockLocalAsset.getBurstParentRemoteId(any(), ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => 'anchor-remote');
      when(
        () => mockNativeApi.getCurrentResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => null);

      final errors = <String>[];
      await sut.uploadManual([member], callbacks: UploadCallbacks(onError: (_, msg) => errors.add(msg)));

      expect(errors, hasLength(1));
      verifyNever(
        () => mockUpload.uploadFile(
          file: any(named: 'file'),
          originalFileName: any(named: 'originalFileName'),
          fields: any(named: 'fields'),
          cancelToken: any(named: 'cancelToken'),
          onProgress: any(named: 'onProgress'),
          logContext: any(named: 'logContext'),
        ),
      );
    });

    test('aborts the batch on cancellation', () async {
      when(
        () => mockLocalAsset.getBurstParentRemoteId(any(), ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => 'anchor-remote');
      stubbedResult = UploadResult.cancelled();

      final successes = <String>[];
      await sut.uploadManual([member], callbacks: UploadCallbacks(onSuccess: (_, remoteId) => successes.add(remoteId)));

      expect(sut.shouldAbortUpload, isTrue);
      expect(successes, isEmpty);
      verifyNever(
        () => mockLocalAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('surfaces a quota error and aborts the batch', () async {
      when(
        () => mockLocalAsset.getBurstParentRemoteId(any(), ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => 'anchor-remote');
      stubbedResult = UploadResult.error(errorMessage: 'Quota has been exceeded!', statusCode: 413);

      final errors = <String>[];
      await sut.uploadManual([member], callbacks: UploadCallbacks(onError: (_, msg) => errors.add(msg)));

      expect(errors, ['Quota has been exceeded!']);
      expect(sut.shouldAbortUpload, isTrue);
    });
  });
}
