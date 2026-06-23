import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:mocktail/mocktail.dart';

import '../domain/service.mock.dart';
import '../fixtures/asset.stub.dart';
import '../infrastructure/repository.mock.dart';
import '../mocks/asset_entity.mock.dart';
import '../repository.mocks.dart';

void main() {
  late BackgroundUploadService sut;
  late _CallbackUploadRepository mockUploadRepository;
  late MockStorageRepository mockStorageRepository;
  late MockDriftLocalAssetRepository mockLocalAssetRepository;
  late MockDriftBackupRepository mockBackupRepository;
  late MockAssetMediaRepository mockAssetMediaRepository;
  late MockNativeSyncApi mockNativeSyncApi;
  late MockEditRevertService mockEditRevertService;
  late MockDriftStackRepository mockStackRepository;
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(<UploadTask>[]);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (MethodCall methodCall) async => 'test',
    );
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
    await SettingsRepository.ensureInitialized(db);

    await Store.put(StoreKey.serverEndpoint, 'http://test-server.com');
    await Store.put(StoreKey.deviceId, 'test-device-id');
  });

  setUp(() {
    mockUploadRepository = _CallbackUploadRepository();
    mockStorageRepository = MockStorageRepository();
    mockLocalAssetRepository = MockDriftLocalAssetRepository();
    mockBackupRepository = MockDriftBackupRepository();
    mockAssetMediaRepository = MockAssetMediaRepository();
    mockNativeSyncApi = MockNativeSyncApi();
    mockEditRevertService = MockEditRevertService();
    mockStackRepository = MockDriftStackRepository();

    sut = BackgroundUploadService(
      mockUploadRepository,
      mockStorageRepository,
      mockLocalAssetRepository,
      mockBackupRepository,
      mockAssetMediaRepository,
      mockNativeSyncApi,
      mockEditRevertService,
      mockStackRepository,
    );

    // Default: no edit base, so getUploadTask falls through to the normal path.
    when(
      () => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
    ).thenAnswer((_) async => null);

    // Default: not a revert, so getUploadTask proceeds with the normal flow.
    when(() => mockEditRevertService.tryHandleRevert(any())).thenAnswer((_) async => null);

    // Default: prior remotes are alive, so absorb is allowed.
    when(() => mockStackRepository.priorState(any())).thenAnswer((_) async => PriorState.live);

    // Default: the photo still reads as edited, so chain junctions proceed.
    when(
      () => mockNativeSyncApi.getEditState(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
    ).thenAnswer((_) async => EditState.edited);

    // Default: no task with the same id is already active, so chain enqueues proceed.
    when(() => mockUploadRepository.getTaskById(any())).thenAnswer((_) async => null);
  });

  tearDown(() {
    sut.dispose();
  });

  group('getUploadTask', () {
    test('should call getOriginalFilename from AssetMediaRepository for regular photo', () async {
      final asset = LocalAssetStub.image1;
      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/file.jpg');

      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => mockFile);
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'OriginalPhoto.jpg');

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('OriginalPhoto.jpg'));
      // a plain photo is a timeline asset — never uploaded hidden
      expect(task.fields.containsKey('visibility'), isFalse);
      verify(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).called(1);
    });

    test('should call getOriginalFilename when original filename is null', () async {
      final asset = LocalAssetStub.image2;
      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/file.jpg');

      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => mockFile);
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => null);

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.fields['filename'], equals(asset.name));
      verify(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).called(1);
    });

    test('should call getOriginalFilename for live photo', () async {
      final asset = LocalAssetStub.image1;
      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/file.mov');

      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getMotionFileForAsset(asset)).thenAnswer((_) async => mockFile);
      when(
        () => mockAssetMediaRepository.getOriginalFilename(asset.id),
      ).thenAnswer((_) async => 'OriginalLivePhoto.HEIC');

      final task = await sut.getUploadTask(asset);
      expect(task, isNotNull);
      // For live photos, extension should be changed to match the video file
      expect(task!.fields['filename'], equals('OriginalLivePhoto.mov'));
      // the motion video uploads hidden so it never flashes onto the timeline
      expect(task.fields['visibility'], 'hidden');
      verify(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).called(1);
    });
  });

  group('getUploadTask burst (iOS incremental stacking)', () {
    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);
    });

    test('representative uploads via the normal path (no native fetch, becomes the anchor)', () async {
      final rep = LocalAssetStub.image1.copyWith(burstId: 'burst-1', isBurstRepresentative: true);
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(rep)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(rep.id)).thenAnswer((_) async => File('/path/rep.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(rep.id)).thenAnswer((_) async => 'rep.jpg');

      final task = await sut.getUploadTask(rep);

      expect(task, isNotNull);
      // the rep is a plain new upload — no stack fields, resolved via photo_manager
      expect(task!.fields.containsKey('stackParentId'), isFalse);
      expect(task.fields.containsKey('keepPrimary'), isFalse);
      verify(() => mockStorageRepository.getAssetEntityForAsset(rep)).called(1);
      verifyNever(
        () => mockNativeSyncApi.getCurrentResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      );
    });

    test('non-representative with the anchor uploaded stacks under it with keepPrimary', () async {
      final member = LocalAssetStub.image1.copyWith(burstId: 'burst-1', isBurstRepresentative: false);
      when(
        () => mockLocalAssetRepository.getBurstParentRemoteId('burst-1', ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => 'rep-remote-id');
      when(
        () => mockNativeSyncApi.getCurrentResource(member.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: '/tmp/member_base.jpg', sha1: 'sha-member'));
      when(() => mockAssetMediaRepository.getOriginalFilename(member.id)).thenAnswer((_) async => 'member.jpg');

      final task = await sut.getUploadTask(member);

      expect(task, isNotNull);
      expect(task!.fields['stackParentId'], 'rep-remote-id');
      expect(task.fields['keepPrimary'], 'true');
      // photo_manager can't resolve a non-rep — never goes through the entity path
      verifyNever(() => mockStorageRepository.getAssetEntityForAsset(any()));
    });

    test('non-representative is gated (no task, no native fetch) until the anchor lands', () async {
      final member = LocalAssetStub.image1.copyWith(burstId: 'burst-1', isBurstRepresentative: false);
      when(
        () => mockLocalAssetRepository.getBurstParentRemoteId('burst-1', ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => null);
      // a representative still exists, so the member waits for it (not standalone)
      when(() => mockLocalAssetRepository.burstHasRepresentative('burst-1')).thenAnswer((_) async => true);

      final task = await sut.getUploadTask(member);

      expect(task, isNull);
      verifyNever(
        () => mockNativeSyncApi.getCurrentResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      );
    });

    test('rep-less burst member uploads standalone (no anchor, no stack fields)', () async {
      // Keep Everything / re-pick can leave a group with no representative; the
      // member can never anchor, so it uploads as its own asset.
      final member = LocalAssetStub.image1.copyWith(burstId: 'burst-1', isBurstRepresentative: false);
      when(
        () => mockLocalAssetRepository.getBurstParentRemoteId('burst-1', ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => null);
      when(() => mockLocalAssetRepository.burstHasRepresentative('burst-1')).thenAnswer((_) async => false);
      when(
        () => mockNativeSyncApi.getCurrentResource(member.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: '/tmp/member_base.jpg', sha1: 'sha-member'));
      when(() => mockAssetMediaRepository.getOriginalFilename(member.id)).thenAnswer((_) async => 'member.jpg');

      final task = await sut.getUploadTask(member);

      expect(task, isNotNull);
      expect(task!.fields.containsKey('stackParentId'), isFalse);
      expect(task.fields.containsKey('keepPrimary'), isFalse);
    });

    test('non-representative returns null when the native rendition is unavailable', () async {
      final member = LocalAssetStub.image1.copyWith(burstId: 'burst-1', isBurstRepresentative: false);
      when(
        () => mockLocalAssetRepository.getBurstParentRemoteId('burst-1', ownerId: any(named: 'ownerId')),
      ).thenAnswer((_) async => 'rep-remote-id');
      when(
        () => mockNativeSyncApi.getCurrentResource(member.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => null);

      expect(await sut.getUploadTask(member), isNull);
    });

    test('android burst member is NOT short-circuited (bursts are iOS-only)', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      final member = LocalAssetStub.image1.copyWith(burstId: 'burst-1', isBurstRepresentative: false);
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(member)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(member.id)).thenAnswer((_) async => File('/path/m.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(member.id)).thenAnswer((_) async => 'm.jpg');

      final task = await sut.getUploadTask(member);

      expect(task, isNotNull);
      verify(() => mockStorageRepository.getAssetEntityForAsset(member)).called(1);
      verifyNever(
        () => mockNativeSyncApi.getCurrentResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      );
    });
  });

  group('getUploadTask edit pair', () {
    test('absorption: stacks the edit under the prior upload via stackParentId', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(priorRemoteId: 'prior-remote-1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/edit.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'edit.jpg');

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.group, kBackupEditPairGroup);
      expect(task.fields['stackParentId'], 'prior-remote-1');
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('builds a base upload task for an unsynced edit', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(
        checksum: 'edited-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(
        () => mockNativeSyncApi.getBaseResource(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: '/tmp/base.jpg', sha1: 'original-sha1'));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.group, kBackupGroup);
      expect(task.taskId, '${asset.id}_bs');
      expect(UploadTaskMetadata.fromJson(task.metaData).liveEditPhase, LiveEditPhase.baseStill);
    });

    test('falls through to a normal upload when base bytes match the checksum', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(
        checksum: 'same-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/file.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'photo.jpg');
      when(
        () => mockNativeSyncApi.getBaseResource(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: '/tmp/base.jpg', sha1: 'same-sha1'));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.group, kBackupGroup);
      expect(task.fields.containsKey('stackParentId'), isFalse);
    });

    test('gate: skips the native read for an unedited photo (adjustmentTime == createdAt)', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(adjustmentTime: LocalAssetStub.image1.createdAt);
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/file.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'photo.jpg');

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.group, kBackupGroup);
      expect(task.fields.containsKey('stackParentId'), isFalse);
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('gate: skips the native read when the photo has no adjustmentTime', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1; // adjustmentTime is null
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/file.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'photo.jpg');

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.group, kBackupGroup);
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('revert: a reverted edit short-circuits to null without touching files', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(priorRemoteId: 'prior-remote-1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockEditRevertService.tryHandleRevert(asset)).thenAnswer((_) async => 'base-remote-1');

      final task = await sut.getUploadTask(asset);

      expect(task, isNull);
      verify(() => mockEditRevertService.tryHandleRevert(asset)).called(1);
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
      verifyNever(
        () => mockNativeSyncApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      );
      verifyNever(() => mockStorageRepository.getFileForAsset(any()));
    });

    test('rebuild: a stamped prior gone from the server falls through and threads the stale id', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(
        priorRemoteId: 'dead-prior-1',
        syncedChecksum: 'old-sha1',
        checksum: 'edited-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState('dead-prior-1')).thenAnswer((_) async => PriorState.missing);
      when(
        () => mockNativeSyncApi.getBaseResource(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: '/tmp/base.jpg', sha1: 'original-sha1'));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_bs');
      expect(task.group, kBackupGroup);
      final meta = UploadTaskMetadata.fromJson(task.metaData);
      expect(meta.liveEditPhase, LiveEditPhase.baseStill);
      expect(meta.stalePriorId, 'dead-prior-1');
    });

    test('rebuild: forwards ownerId into the owner-scoped duplicate-base lookup', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(
        priorRemoteId: 'dead-prior-1',
        syncedChecksum: 'old-sha1',
        checksum: 'edited-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState('dead-prior-1')).thenAnswer((_) async => PriorState.missing);
      when(
        () => mockStackRepository.remoteByChecksum('original-sha1', 'owner-1'),
      ).thenAnswer((_) async => (state: PriorState.missing, remoteId: null));
      when(
        () => mockNativeSyncApi.getBaseResource(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseResource(path: '/tmp/base.jpg', sha1: 'original-sha1'));

      final task = await sut.getUploadTask(asset, ownerId: 'owner-1');

      // No duplicate on the server, so the plan stays a rebuild from the base.
      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_bs');
      verify(() => mockStackRepository.remoteByChecksum('original-sha1', 'owner-1')).called(1);
    });

    test('defer: prior sitting in the server trash skips the upload this cycle', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(
        priorRemoteId: 'prior-remote-1',
        checksum: 'edited-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState('prior-remote-1')).thenAnswer((_) async => PriorState.trashed);

      final task = await sut.getUploadTask(asset);

      expect(task, isNull);
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
      verifyNever(() => mockStorageRepository.getFileForAsset(any()));
    });

    test('defer: a failing prior lookup skips the upload this cycle', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(
        priorRemoteId: 'prior-remote-1',
        checksum: 'edited-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState('prior-remote-1')).thenThrow(Exception('db locked'));

      final task = await sut.getUploadTask(asset);

      expect(task, isNull);
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
      verifyNever(() => mockStorageRepository.getFileForAsset(any()));
    });

    test('android: edit fields are ignored and a normal task is built', () async {
      // No platform override, flutter_test defaults to android.
      final asset = LocalAssetStub.image1.copyWith(
        priorRemoteId: 'prior-remote-1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/file.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'photo.jpg');

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.group, kBackupGroup);
      expect(task.fields.containsKey('stackParentId'), isFalse);
      verifyNever(() => mockEditRevertService.tryHandleRevert(any()));
      verifyNever(() => mockNativeSyncApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
      verifyNever(
        () => mockNativeSyncApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      );
    });
  });

  group('still photo edit chain completion', () {
    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    });

    tearDown(() => debugDefaultTargetPlatformOverride = null);

    test('base still complete: stamps the base as prior and enqueues the edit still', () async {
      final asset = LocalAssetStub.image1;
      final metadata = UploadTaskMetadata(localAssetId: asset.id, liveEditPhase: LiveEditPhase.baseStill);
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'base.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"base-remote-1"}',
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/edit.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'edit.jpg');
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [true]);
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      await sut.handleLiveEditChain(update, metadata);

      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'base-remote-1', syncedChecksum: null),
      ).called(1);
      final enqueued =
          verify(() => mockUploadRepository.enqueueBackgroundAll(captureAny())).captured.single as List<UploadTask>;
      expect(enqueued.single.taskId, asset.id);
      expect(enqueued.single.fields['stackParentId'], 'base-remote-1');
      expect(enqueued.single.fields.containsKey('livePhotoVideoId'), isFalse);
      expect(enqueued.single.group, kBackupEditPairGroup);
      expect(UploadTaskMetadata.fromJson(enqueued.single.metaData).liveEditPhase, LiveEditPhase.editStill);
    });

    test('base still complete: a re-edit mid-chain stamps the base but drops the edit hop', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'edited-sha2');
      final metadata = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseStill,
        checksum: 'edited-sha1',
      );
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'base.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"base-rem-1"}',
      );
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      await sut.handleLiveEditChain(update, metadata);

      // The base stays stamped so the re-edit absorbs onto it next cycle.
      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'base-rem-1', syncedChecksum: null),
      ).called(1);
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('base still complete: a revert mid-chain stamps the base but drops the edit hop', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'edited-sha1');
      final metadata = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseStill,
        checksum: 'edited-sha1',
      );
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'base.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"base-rem-1"}',
      );
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockNativeSyncApi.getEditState(asset.id, allowNetworkAccess: false),
      ).thenAnswer((_) async => EditState.notEdited);
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      await sut.handleLiveEditChain(update, metadata);

      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'base-rem-1', syncedChecksum: null),
      ).called(1);
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('base still complete: an edit-state probe failure lets the chain finish', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'edited-sha1');
      final metadata = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseStill,
        checksum: 'edited-sha1',
      );
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'base.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"base-rem-1"}',
      );
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockNativeSyncApi.getEditState(asset.id, allowNetworkAccess: false),
      ).thenThrow(PlatformException(code: 'unknownEditState'));
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/edit.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'edit.jpg');
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [true]);
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      await sut.handleLiveEditChain(update, metadata);

      final enqueued =
          verify(() => mockUploadRepository.enqueueBackgroundAll(captureAny())).captured.single as List<UploadTask>;
      expect(enqueued.single.taskId, asset.id);
      expect(enqueued.single.fields['stackParentId'], 'base-rem-1');
    });

    test('phase none: completion router does nothing', () async {
      const metadata = UploadTaskMetadata(localAssetId: 'local-1');
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'photo.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"remote-1"}',
      );

      await sut.handleLiveEditChain(update, metadata);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('recordPriorRemoteIdOnSuccess: legacy metadata without a checksum stamps a null syncedChecksum', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'row-sha1');
      final metadata = UploadTaskMetadata(localAssetId: asset.id);
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'photo.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"remote-1"}',
      );
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      await sut.recordPriorRemoteIdOnSuccess(update, metadata);

      // The photo may have been edited while the legacy task sat in the queue;
      // falling back to the row checksum would suppress that edit forever. null
      // keeps the asset re-resolvable, and the row is never even read.
      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'remote-1', syncedChecksum: null),
      ).called(1);
      verifyNever(() => mockLocalAssetRepository.getById(any()));
    });

    test('recordPriorRemoteIdOnSuccess: uses the checksum captured at task build time', () async {
      final asset = LocalAssetStub.image1;
      final metadata = UploadTaskMetadata(localAssetId: asset.id, checksum: 'built-sha1');
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'photo.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"remote-1"}',
      );
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      await sut.recordPriorRemoteIdOnSuccess(update, metadata);

      // The build-time checksum wins so a re-edit racing this upload can't be
      // marked synced; the row is never even read.
      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'remote-1', syncedChecksum: 'built-sha1'),
      ).called(1);
      verifyNever(() => mockLocalAssetRepository.getById(any()));
    });

    test('recordPriorRemoteIdOnSuccess: skips edit chain hops', () async {
      const metadata = UploadTaskMetadata(localAssetId: 'local-1', liveEditPhase: LiveEditPhase.baseStill);
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'base.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"base-remote-1"}',
      );

      await sut.recordPriorRemoteIdOnSuccess(update, metadata);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('recordPriorRemoteIdOnSuccess: never stamps on android', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;

      const metadata = UploadTaskMetadata(localAssetId: 'local-1', checksum: 'built-sha1');
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'photo.jpg'),
        TaskStatus.complete,
        null,
        '{"id":"remote-1"}',
      );

      await sut.recordPriorRemoteIdOnSuccess(update, metadata);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('recordPriorRemoteIdOnSuccess: skips live photos', () async {
      const metadata = UploadTaskMetadata(localAssetId: 'local-1', isLivePhotos: true);
      final update = TaskStatusUpdate(
        UploadTask(url: 'http://test-server.com', filename: 'live.mov'),
        TaskStatus.complete,
        null,
        '{"id":"video-remote-1"}',
      );

      await sut.recordPriorRemoteIdOnSuccess(update, metadata);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });
  });

  group('live photo edit chain', () {
    // An iOS live photo with a real edit (adjustmentTime well past createdAt).
    LocalAsset editedLive({String? priorRemoteId, String? syncedChecksum}) => LocalAssetStub.image1.copyWith(
      checksum: 'edited-sha1',
      adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      priorRemoteId: priorRemoteId,
      syncedChecksum: syncedChecksum,
    );

    BaseResource res(String path, String sha1) => BaseResource(path: path, sha1: sha1);

    setUp(() {
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [true]);
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});
    });

    TaskStatusUpdate completed(String id) => TaskStatusUpdate(
      UploadTask(url: 'http://test-server.com', filename: 'f'),
      TaskStatus.complete,
      null,
      '{"id":"$id"}',
    );

    UploadTask enqueuedTask() =>
        (verify(() => mockUploadRepository.enqueueBackgroundAll(captureAny())).captured.single as List<UploadTask>)
            .single;

    test('entry: edited live photo uploads the base video first', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = editedLive();
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(
        () => mockNativeSyncApi.getBaseLivePhoto(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer(
        (_) async => BaseLivePhoto(still: res('/tmp/base.heic', 'original-sha1'), video: res('/tmp/base.mov', 'v')),
      );

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_bv');
      expect(task.group, kBackupGroup);
      // base motion video uploads hidden — never on the timeline mid-chain
      expect(task.fields['visibility'], 'hidden');
      final meta = UploadTaskMetadata.fromJson(task.metaData);
      expect(meta.liveEditPhase, LiveEditPhase.baseVideo);
      expect(meta.baseStillPath, '/tmp/base.heic');
      expect(meta.basePath, '/tmp/base.mov');
    });

    test('entry: edit that dropped the paired video starts at the base still', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = editedLive();
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(
        () => mockNativeSyncApi.getBaseLivePhoto(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => BaseLivePhoto(still: res('/tmp/base.heic', 'original-sha1'), video: null));

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_bs');
      // chain entry, so it queues like any new upload instead of jumping the queue
      expect(task.group, kBackupGroup);
      expect(task.fields.containsKey('livePhotoVideoId'), isFalse);
      expect(UploadTaskMetadata.fromJson(task.metaData).liveEditPhase, LiveEditPhase.baseStill);
    });

    test('entry: re-edit of a stacked live photo uploads its new video, not just the still', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = editedLive(priorRemoteId: 'parent-1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getMotionFileForAsset(asset)).thenAnswer((_) async => File('/tmp/edit.mov'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'IMG.HEIC');

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_ev');
      // edit motion video uploads hidden too
      expect(task.fields['visibility'], 'hidden');
      final meta = UploadTaskMetadata.fromJson(task.metaData);
      expect(meta.liveEditPhase, LiveEditPhase.editVideo);
      expect(meta.pendingStackParentId, 'parent-1');
      verifyNever(
        () => mockNativeSyncApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      );
    });

    test('base video complete: enqueues the base still linked to the uploaded video', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: '/tmp/base.heic',
      );

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      final next = enqueuedTask();
      expect(next.taskId, '${asset.id}_bs');
      expect(next.fields['livePhotoVideoId'], 'basevid-1');
      expect(UploadTaskMetadata.fromJson(next.metaData).liveEditPhase, LiveEditPhase.baseStill);
    });

    test('base still complete: stamps priorRemoteId and enqueues the edit video', () async {
      final asset = editedLive();
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(any())).thenAnswer((_) async => mockEntity);
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockStorageRepository.getMotionFileForAsset(any())).thenAnswer((_) async => File('/tmp/edit.mov'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'IMG.HEIC');
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.baseStill,
      );

      await sut.handleLiveEditChain(completed('basestill-1'), meta);

      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'basestill-1', syncedChecksum: null),
      ).called(1);
      final next = enqueuedTask();
      expect(next.taskId, '${asset.id}_ev');
      final nextMeta = UploadTaskMetadata.fromJson(next.metaData);
      expect(nextMeta.liveEditPhase, LiveEditPhase.editVideo);
      expect(nextMeta.pendingStackParentId, 'basestill-1');
    });

    test('base still complete: a replay after the stamp does nothing (idempotent)', () async {
      final asset = editedLive(priorRemoteId: 'basestill-1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.baseStill,
      );

      await sut.handleLiveEditChain(completed('basestill-1'), meta);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('base video complete: a replay after the stamp does not fork a second chain', () async {
      final asset = editedLive(priorRemoteId: 'basestill-1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: '/tmp/base.heic',
      );

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('entry: rebuild over a hard-deleted prior threads the stale id', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = editedLive(priorRemoteId: 'dead-prior-1', syncedChecksum: 'old-sha1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState('dead-prior-1')).thenAnswer((_) async => PriorState.missing);
      when(
        () => mockNativeSyncApi.getBaseLivePhoto(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer(
        (_) async => BaseLivePhoto(still: res('/tmp/base.heic', 'original-sha1'), video: res('/tmp/base.mov', 'v')),
      );

      final task = await sut.getUploadTask(asset);

      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_bv');
      expect(UploadTaskMetadata.fromJson(task.metaData).stalePriorId, 'dead-prior-1');
    });

    test('rebuild: base video completion over the dead prior still enqueues the base still', () async {
      // Real rebuild state: the row still carries the previous chain's terminal
      // stamps (synced == checksum) — only the stale prior id says "proceed".
      final asset = editedLive(priorRemoteId: 'dead-prior-1', syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: '/tmp/base.heic',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      final next = enqueuedTask();
      expect(next.taskId, '${asset.id}_bs');
      expect(next.fields['livePhotoVideoId'], 'basevid-1');
      // forwarded so the base still junction can tell rebuild from replay too
      expect(UploadTaskMetadata.fromJson(next.metaData).stalePriorId, 'dead-prior-1');
    });

    test('rebuild: base still completion over the dead prior re-stamps and continues', () async {
      final asset = editedLive(priorRemoteId: 'dead-prior-1', syncedChecksum: 'edited-sha1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(any())).thenAnswer((_) async => mockEntity);
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockStorageRepository.getMotionFileForAsset(any())).thenAnswer((_) async => File('/tmp/edit.mov'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'IMG.HEIC');
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseStill,
        checksum: 'edited-sha1',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('newbase-1'), meta);

      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'newbase-1', syncedChecksum: null),
      ).called(1);
      final next = enqueuedTask();
      expect(next.taskId, '${asset.id}_ev');
      expect(UploadTaskMetadata.fromJson(next.metaData).pendingStackParentId, 'newbase-1');
    });

    test('rebuild: base still replay drops once the stamp advanced past the dead prior', () async {
      final asset = editedLive(priorRemoteId: 'newbase-1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseStill,
        checksum: 'edited-sha1',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('newbase-1'), meta);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('base still complete: a finished-chain replay (no stale prior) drops outright', () async {
      // Terminal state of a completed chain: synced == checksum. Without a
      // stalePriorId this completion is a replay, not a rebuild — it must not
      // clear the stamps or re-enqueue anything.
      final asset = editedLive(syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseStill,
        checksum: 'edited-sha1',
      );

      await sut.handleLiveEditChain(completed('newbase-1'), meta);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('rebuild: base video replay drops once the stamp advanced past the dead prior', () async {
      final asset = editedLive(priorRemoteId: 'newbase-1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: '/tmp/base.heic',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('absorb over stale stamps: the edit video carries the dead prior as stalePriorId', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      // Finished-chain stamps (synced == checksum) but the prior was hard-deleted;
      // the base bytes still live on the server under another id, so the plan
      // absorbs onto that copy while the row keeps the stale terminal stamps.
      final asset = editedLive(priorRemoteId: 'dead-prior-1', syncedChecksum: 'edited-sha1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState('dead-prior-1')).thenAnswer((_) async => PriorState.missing);
      when(
        () => mockNativeSyncApi.getBaseLivePhoto(asset.id, allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer(
        (_) async => BaseLivePhoto(still: res('/tmp/base.heic', 'original-sha1'), video: res('/tmp/base.mov', 'v')),
      );
      when(
        () => mockStackRepository.remoteByChecksum('original-sha1', 'owner-1'),
      ).thenAnswer((_) async => (state: PriorState.live, remoteId: 'live-base-1'));
      when(() => mockStorageRepository.getMotionFileForAsset(asset)).thenAnswer((_) async => File('/tmp/edit.mov'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'IMG.HEIC');

      final task = await sut.getUploadTask(asset, ownerId: 'owner-1');

      expect(task, isNotNull);
      expect(task!.taskId, '${asset.id}_ev');
      final meta = UploadTaskMetadata.fromJson(task.metaData);
      expect(meta.liveEditPhase, LiveEditPhase.editVideo);
      expect(meta.pendingStackParentId, 'live-base-1');
      // the dead prior rides along so the junctions don't mistake this chain's
      // completions for finished-chain replays
      expect(meta.stalePriorId, 'dead-prior-1');
    });

    test('absorb over stale stamps: the edit video completion proceeds while the prior is unchanged', () async {
      final asset = editedLive(priorRemoteId: 'dead-prior-1', syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/tmp/edit.heic'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'IMG.HEIC');
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editVideo,
        pendingStackParentId: 'live-base-1',
        checksum: 'edited-sha1',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('editvid-1'), meta);

      final next = enqueuedTask();
      expect(next.taskId, asset.id);
      expect(next.fields['livePhotoVideoId'], 'editvid-1');
      expect(next.fields['stackParentId'], 'live-base-1');
      final nextMeta = UploadTaskMetadata.fromJson(next.metaData);
      expect(nextMeta.liveEditPhase, LiveEditPhase.editStill);
      // forwarded so the edit still junction can tell this chain from a replay too
      expect(nextMeta.stalePriorId, 'dead-prior-1');
    });

    test('absorb over stale stamps: the edit still completion re-stamps the terminal state', () async {
      final asset = editedLive(priorRemoteId: 'dead-prior-1', syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editStill,
        checksum: 'edited-sha1',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('editstill-1'), meta);

      verify(
        () =>
            mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'editstill-1', syncedChecksum: 'edited-sha1'),
      ).called(1);
    });

    test('absorb over stale stamps: replays drop once the prior advanced past the dead id', () async {
      // The terminal hop re-stamped the prior; the same completions delivered
      // again must not fork a second chain or re-mark anything.
      final asset = editedLive(priorRemoteId: 'editstill-1', syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final videoMeta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editVideo,
        pendingStackParentId: 'live-base-1',
        checksum: 'edited-sha1',
        stalePriorId: 'dead-prior-1',
      );
      final stillMeta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editStill,
        checksum: 'edited-sha1',
        stalePriorId: 'dead-prior-1',
      );

      await sut.handleLiveEditChain(completed('editvid-1'), videoMeta);
      await sut.handleLiveEditChain(completed('editstill-1'), stillMeta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('base video complete: a pre-stamp replay skips while the base still task is active', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockUploadRepository.getTaskById('${asset.id}_bs'),
      ).thenAnswer((_) async => UploadTask(taskId: '${asset.id}_bs', url: 'http://test-server.com', filename: 'f'));
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: '/tmp/base.heic',
      );

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('base video complete: an enqueue failure deletes the base still temp', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [false]);
      final tempDir = await Directory.systemTemp.createTemp('bg_upload_chain');
      addTearDown(() async {
        if (await tempDir.exists()) {
          await tempDir.delete(recursive: true);
        }
      });
      final baseStill = await File('${tempDir.path}/base.heic').create();
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: baseStill.path,
      );

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      expect(await baseStill.exists(), isFalse);
    });

    test('base video complete: an abort mid-cancel skips the enqueue and drops the carried temp', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final tempDir = await Directory.systemTemp.createTemp('bg_upload_abort');
      addTearDown(() async {
        if (await tempDir.exists()) {
          await tempDir.delete(recursive: true);
        }
      });
      final baseStill = await File('${tempDir.path}/base.heic').create();
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.baseVideo,
        basePath: '/tmp/base.mov',
        baseStillPath: baseStill.path,
      );
      sut.shouldAbortQueuingTasks = true;

      await sut.handleLiveEditChain(completed('basevid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
      expect(await baseStill.exists(), isFalse);
    });

    test('edit video complete: a replay skips while the edit still task is active', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockUploadRepository.getTaskById(asset.id),
      ).thenAnswer((_) async => UploadTask(taskId: asset.id, url: 'http://test-server.com', filename: 'f'));
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editVideo,
        pendingStackParentId: 'basestill-1',
      );

      await sut.handleLiveEditChain(completed('editvid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('edit video complete: enqueues the edit still with both link fields', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/tmp/edit.heic'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'IMG.HEIC');
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.editVideo,
        pendingStackParentId: 'basestill-1',
      );

      await sut.handleLiveEditChain(completed('editvid-1'), meta);

      final next = enqueuedTask();
      expect(next.taskId, asset.id);
      expect(next.fields['livePhotoVideoId'], 'editvid-1');
      expect(next.fields['stackParentId'], 'basestill-1');
      expect(UploadTaskMetadata.fromJson(next.metaData).liveEditPhase, LiveEditPhase.editStill);
    });

    test('edit video complete: a re-edit mid-chain drops the edit still', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editVideo,
        pendingStackParentId: 'basestill-1',
        checksum: 'stale-sha1',
      );

      await sut.handleLiveEditChain(completed('editvid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('edit still complete: stamps the edit as the new prior and marks it synced', () async {
      final asset = editedLive();
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.editStill,
      );

      await sut.handleLiveEditChain(completed('editstill-1'), meta);

      verify(
        () =>
            mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'editstill-1', syncedChecksum: asset.checksum),
      ).called(1);
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('edit video complete: redelivered after the chain has synced, does not re-enqueue the still', () async {
      final asset = editedLive(priorRemoteId: 'basestill-1', syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        liveEditPhase: LiveEditPhase.editVideo,
        pendingStackParentId: 'basestill-1',
      );

      await sut.handleLiveEditChain(completed('editvid-1'), meta);

      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('edit still complete: redelivered after the chain has synced, does not re-mark', () async {
      final asset = editedLive(priorRemoteId: 'editstill-1', syncedChecksum: 'edited-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final meta = UploadTaskMetadata(localAssetId: asset.id, liveEditPhase: LiveEditPhase.editStill);

      await sut.handleLiveEditChain(completed('editstill-1'), meta);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('recordPriorRemoteIdOnSuccess: skips live-edit chain hops', () async {
      final asset = editedLive();
      final meta = UploadTaskMetadata(
        localAssetId: asset.id,
        isLivePhotos: false,
        livePhotoVideoId: '',
        liveEditPhase: LiveEditPhase.baseVideo,
      );

      await sut.recordPriorRemoteIdOnSuccess(completed('basevid-1'), meta);

      verifyNever(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });
  });

  group('UploadTaskMetadata back-compat', () {
    test('payload without edit-chain keys decodes with defaults', () {
      final meta = UploadTaskMetadata.fromJson('{"localAssetId":"a","isLivePhotos":true,"livePhotoVideoId":""}');

      expect(meta.localAssetId, 'a');
      expect(meta.isLivePhotos, isTrue);
      expect(meta.livePhotoVideoId, '');
      expect(meta.liveEditPhase, LiveEditPhase.none);
      expect(meta.basePath, '');
      expect(meta.baseStillPath, '');
      expect(meta.pendingStackParentId, '');
      expect(meta.checksum, isNull);
      expect(meta.stalePriorId, '');
    });

    test('unknown liveEditPhase falls back to none', () {
      final meta = UploadTaskMetadata.fromJson('{"localAssetId":"a","liveEditPhase":"someFutureHop"}');

      expect(meta.liveEditPhase, LiveEditPhase.none);
      expect(meta.isLivePhotos, isFalse);
    });

    test('unknown metadata keys are ignored', () {
      final meta = UploadTaskMetadata.fromJson('{"localAssetId":"a","someFutureKey":true}');

      expect(meta.localAssetId, 'a');
      expect(meta.liveEditPhase, LiveEditPhase.none);
    });
  });

  group('cleanupTempResourceOnFailure', () {
    test('deletes both temp files', () async {
      final tempDir = await Directory.systemTemp.createTemp('bg_upload_cleanup');
      addTearDown(() async {
        if (await tempDir.exists()) {
          await tempDir.delete(recursive: true);
        }
      });
      final base = await File('${tempDir.path}/base.mov').create();
      final baseStill = await File('${tempDir.path}/base.heic').create();
      final metadata = UploadTaskMetadata(localAssetId: 'a', basePath: base.path, baseStillPath: baseStill.path);

      await sut.cleanupTempResourceOnFailure(metadata);

      expect(await base.exists(), isFalse);
      expect(await baseStill.exists(), isFalse);
    });

    test('empty paths are a no-op', () async {
      const metadata = UploadTaskMetadata(localAssetId: 'a');

      await sut.cleanupTempResourceOnFailure(metadata);
    });

    test('missing files do not throw', () async {
      const metadata = UploadTaskMetadata(
        localAssetId: 'a',
        basePath: '/nonexistent/base.mov',
        baseStillPath: '/nonexistent/base.heic',
      );

      await sut.cleanupTempResourceOnFailure(metadata);
    });
  });

  group('getActiveBackupTaskCount', () {
    test('sums active tasks across all backup groups', () async {
      when(() => mockUploadRepository.getActiveTasks(kBackupGroup)).thenAnswer((_) async => <Task>[]);
      when(
        () => mockUploadRepository.getActiveTasks(kBackupEditPairGroup),
      ).thenAnswer((_) async => <Task>[UploadTask(url: 'http://test-server.com', filename: 'f')]);
      when(() => mockUploadRepository.getActiveTasks(kBackupLivePhotoGroup)).thenAnswer((_) async => <Task>[]);

      final count = await sut.getActiveBackupTaskCount();

      expect(count, 1);
      verify(() => mockUploadRepository.getActiveTasks(kBackupGroup)).called(1);
      verify(() => mockUploadRepository.getActiveTasks(kBackupEditPairGroup)).called(1);
      verify(() => mockUploadRepository.getActiveTasks(kBackupLivePhotoGroup)).called(1);
    });
  });

  group('getLivePhotoUploadTask', () {
    test('should call getOriginalFilename for live photo upload task', () async {
      final asset = LocalAssetStub.image1;
      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/livephoto.heic');

      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => mockFile);
      when(
        () => mockAssetMediaRepository.getOriginalFilename(asset.id),
      ).thenAnswer((_) async => 'OriginalLivePhoto.HEIC');

      final task = await sut.getLivePhotoUploadTask(asset, 'video-id-123');

      expect(task, isNotNull);
      expect(task!.fields['filename'], equals('OriginalLivePhoto.HEIC'));
      expect(task.fields['livePhotoVideoId'], equals('video-id-123'));
      verify(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).called(1);
    });

    test('should call getOriginalFilename when original filename is null', () async {
      final asset = LocalAssetStub.image2;
      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/fallback.heic');

      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => mockFile);
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => null);

      final task = await sut.getLivePhotoUploadTask(asset, 'video-id-456');
      expect(task, isNotNull);
      // Should fall back to asset.name when original filename is null
      expect(task!.fields['filename'], equals(asset.name));
      verify(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).called(1);
    });

    test('carries metadata so the still stamps a prior on success', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'live-sha1');
      final mockEntity = MockAssetEntity();

      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/live.heic'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'live.HEIC');

      final task = await sut.getLivePhotoUploadTask(asset, 'video-id-123');

      expect(task, isNotNull);
      final meta = UploadTaskMetadata.fromJson(task!.metaData);
      expect(meta.localAssetId, asset.id);
      expect(meta.checksum, 'live-sha1');
      expect(meta.liveEditPhase, LiveEditPhase.none);
      expect(meta.isLivePhotos, isFalse);
    });

    test('completed still stamps its remote id as the prior', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      final asset = LocalAssetStub.image1.copyWith(checksum: 'live-sha1');
      final mockEntity = MockAssetEntity();

      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/live.heic'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'live.HEIC');
      when(
        () => mockLocalAssetRepository.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      ).thenAnswer((_) async {});

      final task = await sut.getLivePhotoUploadTask(asset, 'video-id-123');
      final update = TaskStatusUpdate(task!, TaskStatus.complete, null, '{"id":"still-rem-1"}');

      await sut.recordPriorRemoteIdOnSuccess(update, UploadTaskMetadata.fromJson(task.metaData));

      verify(
        () => mockLocalAssetRepository.markSynced(asset.id, priorRemoteId: 'still-rem-1', syncedChecksum: 'live-sha1'),
      ).called(1);
    });
  });

  group('live photo video completion', () {
    UploadTask videoTask(UploadTaskMetadata metadata) =>
        UploadTask(url: 'http://test-server.com', filename: 'live.mov', metaData: metadata.toJson());

    setUp(() {
      // The suite default reads "edited" (for the chain drift tests); the legacy
      // live path probes the edit state too and would silently drop every still
      // here, so reset to notEdited for this group.
      when(
        () => mockNativeSyncApi.getEditState(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => EditState.notEdited);
    });

    test('a redelivered completion after a re-edit does not upload the still', () async {
      // The motion video finished, but the photo was re-edited before the
      // completion landed — uploading the still now would ship the edit
      // standalone. The edit chain owns it instead.
      final asset = LocalAssetStub.image1.copyWith(checksum: 'edited-sha2');
      final metadata = UploadTaskMetadata(localAssetId: asset.id, isLivePhotos: true, checksum: 'live-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      final update = TaskStatusUpdate(videoTask(metadata), TaskStatus.complete, null, '{"id":"video-remote-1"}');

      mockUploadRepository.onUploadStatus!(update);

      await pumpEventQueue();
      verifyNever(() => mockStorageRepository.getAssetEntityForAsset(any()));
      verifyNever(() => mockStorageRepository.getFileForAsset(any()));
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('a completion matching the row checksum still enqueues the still', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'live-sha1');
      final metadata = UploadTaskMetadata(localAssetId: asset.id, isLivePhotos: true, checksum: 'live-sha1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/live.heic'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'live.HEIC');
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [true]);
      final update = TaskStatusUpdate(videoTask(metadata), TaskStatus.complete, null, '{"id":"video-remote-1"}');

      mockUploadRepository.onUploadStatus!(update);

      await untilCalled(() => mockUploadRepository.enqueueBackgroundAll(any()));
      final enqueued =
          verify(() => mockUploadRepository.enqueueBackgroundAll(captureAny())).captured.single as List<UploadTask>;
      expect(enqueued.single.taskId, asset.id);
      expect(enqueued.single.fields['livePhotoVideoId'], 'video-remote-1');
    });

    test('probe: a positive edited read drops the still even when the row checksum matches', () async {
      // The row can be stale in the same window (local sync hasn't seen the
      // edit yet), so the offline adjustment read is the second gate.
      final asset = LocalAssetStub.image1.copyWith(checksum: 'live-sha1');
      final metadata = UploadTaskMetadata(localAssetId: asset.id, isLivePhotos: true, checksum: 'live-sha1');
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockNativeSyncApi.getEditState(asset.id, allowNetworkAccess: false),
      ).thenAnswer((_) async => EditState.edited);
      final update = TaskStatusUpdate(videoTask(metadata), TaskStatus.complete, null, '{"id":"video-remote-1"}');

      mockUploadRepository.onUploadStatus!(update);

      await pumpEventQueue();
      verify(() => mockNativeSyncApi.getEditState(asset.id, allowNetworkAccess: false)).called(1);
      verifyNever(() => mockStorageRepository.getAssetEntityForAsset(any()));
      verifyNever(() => mockStorageRepository.getFileForAsset(any()));
      verifyNever(() => mockUploadRepository.enqueueBackgroundAll(any()));
    });

    test('probe: a failed edit-state read still enqueues the still (no positive evidence)', () async {
      final asset = LocalAssetStub.image1.copyWith(checksum: 'live-sha1');
      final metadata = UploadTaskMetadata(localAssetId: asset.id, isLivePhotos: true, checksum: 'live-sha1');
      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockLocalAssetRepository.getById(asset.id)).thenAnswer((_) async => asset);
      when(
        () => mockNativeSyncApi.getEditState(asset.id, allowNetworkAccess: false),
      ).thenThrow(PlatformException(code: 'unknownEditState'));
      when(() => mockStorageRepository.getAssetEntityForAsset(asset)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(asset.id)).thenAnswer((_) async => File('/path/to/live.heic'));
      when(() => mockAssetMediaRepository.getOriginalFilename(asset.id)).thenAnswer((_) async => 'live.HEIC');
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [true]);
      final update = TaskStatusUpdate(videoTask(metadata), TaskStatus.complete, null, '{"id":"video-remote-1"}');

      mockUploadRepository.onUploadStatus!(update);

      await untilCalled(() => mockUploadRepository.enqueueBackgroundAll(any()));
      final enqueued =
          verify(() => mockUploadRepository.enqueueBackgroundAll(captureAny())).captured.single as List<UploadTask>;
      expect(enqueued.single.taskId, asset.id);
      expect(enqueued.single.fields['livePhotoVideoId'], 'video-remote-1');
    });
  });

  group('dead stack parent on failure', () {
    UploadTask stampedTask() => UploadTask(
      url: 'http://test-server.com',
      filename: 'edit.jpg',
      metaData: const UploadTaskMetadata(localAssetId: 'local-1').toJson(),
    );

    test('a stack-400 naming the dead parent in the response body clears the sync stamps', () async {
      // The server message usually lands in the body; the exception description
      // stays a generic transport-level string.
      when(() => mockLocalAssetRepository.clearSyncStamps(any())).thenAnswer((_) async {});
      final update = TaskStatusUpdate(
        stampedTask(),
        TaskStatus.failed,
        TaskException('bad request'),
        '{"message":"Cannot stack onto a trashed or missing asset","error":"Bad Request","statusCode":400}',
      );

      mockUploadRepository.onUploadStatus!(update);

      await untilCalled(() => mockLocalAssetRepository.clearSyncStamps('local-1'));
      verify(() => mockLocalAssetRepository.clearSyncStamps('local-1')).called(1);
    });

    test('a stack-400 naming the dead parent in the exception description clears the sync stamps', () async {
      when(() => mockLocalAssetRepository.clearSyncStamps(any())).thenAnswer((_) async {});
      final update = TaskStatusUpdate(
        stampedTask(),
        TaskStatus.failed,
        TaskException('400 Cannot stack onto a trashed or missing asset'),
      );

      mockUploadRepository.onUploadStatus!(update);

      await untilCalled(() => mockLocalAssetRepository.clearSyncStamps('local-1'));
      verify(() => mockLocalAssetRepository.clearSyncStamps('local-1')).called(1);
    });

    test('an unrelated failure leaves the stamps alone', () async {
      final update = TaskStatusUpdate(stampedTask(), TaskStatus.failed, TaskException('500 Server error'));

      mockUploadRepository.onUploadStatus!(update);

      await pumpEventQueue();
      verifyNever(() => mockLocalAssetRepository.clearSyncStamps(any()));
    });

    test('an unrelated response body leaves the stamps alone', () async {
      final update = TaskStatusUpdate(
        stampedTask(),
        TaskStatus.failed,
        TaskException('bad request'),
        '{"message":"Quota has been exceeded","statusCode":400}',
      );

      mockUploadRepository.onUploadStatus!(update);

      await pumpEventQueue();
      verifyNever(() => mockLocalAssetRepository.clearSyncStamps(any()));
    });
  });

  group('edit base cache sweep', () {
    setUp(() {
      when(() => mockStorageRepository.clearCache()).thenAnswer((_) async {});
      when(() => mockStorageRepository.clearEditBaseCache()).thenAnswer((_) async {});
    });

    test('a fresh backup cycle sweeps the edit base cache', () async {
      when(() => mockBackupRepository.getCandidates(any())).thenAnswer((_) async => const <LocalAsset>[]);

      await sut.uploadBackupCandidates('user-1');

      verify(() => mockStorageRepository.clearEditBaseCache()).called(1);
    });

    test('cancel sweeps the edit base cache', () async {
      when(() => mockUploadRepository.reset(any())).thenAnswer((_) async => 0);
      when(() => mockUploadRepository.deleteDatabaseRecords(any())).thenAnswer((_) async {});
      when(() => mockUploadRepository.getActiveTasks(any())).thenAnswer((_) async => const <Task>[]);

      await sut.cancel();

      verify(() => mockStorageRepository.clearEditBaseCache()).called(1);
    });
  });

  group('uploadBackupCandidates', () {
    setUp(() {
      when(() => mockStorageRepository.clearCache()).thenAnswer((_) async {});
      when(() => mockStorageRepository.clearEditBaseCache()).thenAnswer((_) async {});
    });

    test('deferred heads do not starve the candidates behind them', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      // Two deferred edit pairs (prior in the server trash) sit ahead of two
      // plain uploads — the batch must still pick the plain ones up.
      final deferA = LocalAssetStub.image1.copyWith(
        id: 'defer-a',
        priorRemoteId: 'trashed-prior-1',
        checksum: 'edited-sha1',
        syncedChecksum: 'old-sha1',
        adjustmentTime: DateTime(2025, 1, 1, 0, 0, 30),
      );
      final deferB = deferA.copyWith(id: 'defer-b', priorRemoteId: 'trashed-prior-2');
      final good1 = LocalAssetStub.image1.copyWith(id: 'good-1');
      final good2 = LocalAssetStub.image2.copyWith(id: 'good-2');

      final mockEntity = MockAssetEntity();
      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(any())).thenAnswer((_) async => mockEntity);
      when(() => mockStackRepository.priorState(any())).thenAnswer((_) async => PriorState.trashed);
      when(() => mockStorageRepository.getFileForAsset(any())).thenAnswer((_) async => File('/path/to/file.jpg'));
      when(() => mockAssetMediaRepository.getOriginalFilename(any())).thenAnswer((_) async => 'photo.jpg');
      when(() => mockBackupRepository.getCandidates(any())).thenAnswer((_) async => [deferA, deferB, good1, good2]);
      when(() => mockUploadRepository.enqueueBackgroundAll(any())).thenAnswer((_) async => [true, true]);

      await sut.uploadBackupCandidates('user-1');

      final enqueued =
          verify(() => mockUploadRepository.enqueueBackgroundAll(captureAny())).captured.single as List<UploadTask>;
      expect(enqueued.map((task) => task.taskId), ['good-1', 'good-2']);
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
        mockAssetMediaRepository,
        mockNativeSyncApi,
        mockEditRevertService,
        mockStackRepository,
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

      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/test.jpg');

      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(assetWithCloudId)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(assetWithCloudId.id)).thenAnswer((_) async => mockFile);
      when(() => mockAssetMediaRepository.getOriginalFilename(assetWithCloudId.id)).thenAnswer((_) async => 'test.jpg');

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
        mockAssetMediaRepository,
        mockNativeSyncApi,
        mockEditRevertService,
        mockStackRepository,
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

      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/test.jpg');

      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(assetWithCloudId)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(assetWithCloudId.id)).thenAnswer((_) async => mockFile);
      when(() => mockAssetMediaRepository.getOriginalFilename(assetWithCloudId.id)).thenAnswer((_) async => 'test.jpg');

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
        mockAssetMediaRepository,
        mockNativeSyncApi,
        mockEditRevertService,
        mockStackRepository,
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

      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/test.jpg');

      when(() => mockEntity.isLivePhoto).thenReturn(false);
      when(() => mockStorageRepository.getAssetEntityForAsset(assetWithoutCloudId)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(assetWithoutCloudId.id)).thenAnswer((_) async => mockFile);
      when(
        () => mockAssetMediaRepository.getOriginalFilename(assetWithoutCloudId.id),
      ).thenAnswer((_) async => 'test.jpg');

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
        mockAssetMediaRepository,
        mockNativeSyncApi,
        mockEditRevertService,
        mockStackRepository,
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
        playbackStyle: AssetPlaybackStyle.image,
        isEdited: false,
      );

      final mockEntity = MockAssetEntity();
      final mockFile = File('/path/to/livephoto.heic');

      when(() => mockEntity.isLivePhoto).thenReturn(true);
      when(() => mockStorageRepository.getAssetEntityForAsset(assetWithCloudId)).thenAnswer((_) async => mockEntity);
      when(() => mockStorageRepository.getFileForAsset(assetWithCloudId.id)).thenAnswer((_) async => mockFile);
      when(
        () => mockAssetMediaRepository.getOriginalFilename(assetWithCloudId.id),
      ).thenAnswer((_) async => 'livephoto.heic');

      final task = await sutWithV24.getLivePhotoUploadTask(assetWithCloudId, 'video-123');

      expect(task, isNotNull);
      expect(task!.fields.containsKey('metadata'), isTrue);
      expect(task.fields['livePhotoVideoId'], equals('video-123'));

      final metadata = jsonDecode(task.fields['metadata']!) as List;
      expect(metadata, hasLength(1));
      expect(metadata[0]['key'], equals('mobile-app'));
      expect(metadata[0]['value']['iCloudId'], equals('cloud-id-livephoto'));
    });
  });
}

// A plain Mock swallows the field assignment the service makes in its
// constructor, so the status callback (and with it _handleTaskStatusUpdate)
// would be unreachable. Real fields keep it invokable from tests.
class _CallbackUploadRepository extends MockUploadRepository {
  void Function(TaskStatusUpdate)? _onUploadStatus;
  void Function(TaskProgressUpdate)? _onTaskProgress;

  @override
  void Function(TaskStatusUpdate)? get onUploadStatus => _onUploadStatus;

  @override
  set onUploadStatus(void Function(TaskStatusUpdate)? value) => _onUploadStatus = value;

  @override
  void Function(TaskProgressUpdate)? get onTaskProgress => _onTaskProgress;

  @override
  set onTaskProgress(void Function(TaskProgressUpdate)? value) => _onTaskProgress = value;
}
