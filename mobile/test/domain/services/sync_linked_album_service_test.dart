import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../fixtures/album.stub.dart';
import '../../fixtures/user.stub.dart';
import '../../infrastructure/repository.mock.dart';

RemoteAlbum _remoteAlbumFor(LocalAlbum local, {required String id}) => RemoteAlbum(
  id: id,
  name: local.name,
  ownerId: UserStub.admin.id,
  ownerName: UserStub.admin.name,
  description: '',
  createdAt: DateTime(2024),
  updatedAt: DateTime(2024),
  isActivityEnabled: true,
  order: AlbumAssetOrder.desc,
  assetCount: 0,
  isShared: false,
);

LocalAlbum _localAlbum({required String id, required String name, String? linkedRemoteAlbumId}) => LocalAlbum(
  id: id,
  name: name,
  updatedAt: DateTime(2024),
  assetCount: 5,
  backupSelection: BackupSelection.selected,
  isIosSharedAlbum: false,
  linkedRemoteAlbumId: linkedRemoteAlbumId,
);

void main() {
  late SyncLinkedAlbumService sut;
  late MockLocalAlbumRepository mockLocalAlbumRepo;
  late MockRemoteAlbumRepository mockRemoteAlbumRepo;
  late MockDriftAlbumApiRepository mockAlbumApiRepo;
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
    await Store.put(StoreKey.currentUser, UserStub.admin);
    registerFallbackValue(LocalAlbumStub.recent);
    registerFallbackValue(UserStub.admin);
    registerFallbackValue(
      RemoteAlbum(
        id: 'fallback',
        name: 'fallback',
        ownerId: 'u',
        ownerName: 'u',
        description: '',
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
        isActivityEnabled: true,
        order: AlbumAssetOrder.desc,
        assetCount: 0,
        isShared: false,
      ),
    );
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  setUp(() {
    mockLocalAlbumRepo = MockLocalAlbumRepository();
    mockRemoteAlbumRepo = MockRemoteAlbumRepository();
    mockAlbumApiRepo = MockDriftAlbumApiRepository();

    sut = SyncLinkedAlbumService(mockLocalAlbumRepo, mockRemoteAlbumRepo, mockAlbumApiRepo, StoreService.I);

    when(() => mockLocalAlbumRepo.linkRemoteAlbum(any(), any())).thenAnswer((_) async {});
    when(() => mockLocalAlbumRepo.unlinkRemoteAlbum(any())).thenAnswer((_) async {});
    when(() => mockRemoteAlbumRepo.deleteAlbum(any())).thenAnswer((_) async {});
    when(() => mockRemoteAlbumRepo.create(any(), any())).thenAnswer((_) async {});
  });

  group('manageLinkedAlbums', () {
    test('soft-fails when server fetch throws, no destructive writes', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies', linkedRemoteAlbumId: 'stale');
      when(() => mockAlbumApiRepo.getAllOwned(any())).thenThrow(ApiException(503, 'down'));

      await sut.manageLinkedAlbums([local], UserStub.admin.id);

      verifyNever(() => mockRemoteAlbumRepo.deleteAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.linkRemoteAlbum(any(), any()));
      verifyNever(() => mockAlbumApiRepo.createDriftAlbum(any(), any(), assetIds: any(named: 'assetIds')));
    });

    test('no-op when linked album still exists on server', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies', linkedRemoteAlbumId: 'r1');
      final remote = _remoteAlbumFor(local, id: 'r1');
      when(() => mockAlbumApiRepo.getAllOwned(any())).thenAnswer((_) async => [remote]);

      await sut.manageLinkedAlbums([local], UserStub.admin.id);

      verifyNever(() => mockRemoteAlbumRepo.deleteAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.linkRemoteAlbum(any(), any()));
      verifyNever(() => mockAlbumApiRepo.createDriftAlbum(any(), any(), assetIds: any(named: 'assetIds')));
    });

    test('prunes stale link when server no longer has the album', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies', linkedRemoteAlbumId: 'stale-id');
      when(() => mockAlbumApiRepo.getAllOwned(any())).thenAnswer((_) async => []);
      when(
        () => mockAlbumApiRepo.createDriftAlbum(any(), any(), assetIds: any(named: 'assetIds')),
      ).thenAnswer((_) async => _remoteAlbumFor(local, id: 'new-id'));

      await sut.manageLinkedAlbums([local], UserStub.admin.id);

      verify(() => mockRemoteAlbumRepo.deleteAlbum('stale-id')).called(1);
      verify(() => mockAlbumApiRepo.createDriftAlbum('Movies', UserStub.admin, assetIds: [])).called(1);
    });

    test('links to existing server album by name when unlinked', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies');
      final existing = _remoteAlbumFor(local, id: 'r-existing');
      when(() => mockAlbumApiRepo.getAllOwned(any())).thenAnswer((_) async => [existing]);
      when(() => mockRemoteAlbumRepo.get('r-existing')).thenAnswer((_) async => null);

      await sut.manageLinkedAlbums([local], UserStub.admin.id);

      verify(() => mockRemoteAlbumRepo.create(existing, [])).called(1);
      verify(() => mockLocalAlbumRepo.linkRemoteAlbum('l1', 'r-existing')).called(1);
      verifyNever(() => mockAlbumApiRepo.createDriftAlbum(any(), any(), assetIds: any(named: 'assetIds')));
    });

    test('creates a new remote album when no match on server', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies');
      final created = _remoteAlbumFor(local, id: 'r-new');
      when(() => mockAlbumApiRepo.getAllOwned(any())).thenAnswer((_) async => []);
      when(
        () => mockAlbumApiRepo.createDriftAlbum(any(), any(), assetIds: any(named: 'assetIds')),
      ).thenAnswer((_) async => created);

      await sut.manageLinkedAlbums([local], UserStub.admin.id);

      verify(() => mockAlbumApiRepo.createDriftAlbum('Movies', UserStub.admin, assetIds: [])).called(1);
      verify(() => mockRemoteAlbumRepo.create(created, [])).called(1);
      verify(() => mockLocalAlbumRepo.linkRemoteAlbum('l1', 'r-new')).called(1);
    });
  });

  group('syncLinkedAlbums', () {
    test('prunes cache row when addAssets throws RemoteAlbumNotFoundException', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies', linkedRemoteAlbumId: 'r-stale');
      final remote = _remoteAlbumFor(local, id: 'r-stale');
      when(() => mockLocalAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [local]);
      when(() => mockRemoteAlbumRepo.get('r-stale')).thenAnswer((_) async => remote);
      when(() => mockRemoteAlbumRepo.getLinkedAssetIds(any(), any(), any())).thenAnswer((_) async => ['a1']);
      when(() => mockAlbumApiRepo.addAssets('r-stale', any())).thenThrow(const RemoteAlbumNotFoundException('r-stale'));

      await sut.syncLinkedAlbums(UserStub.admin.id);

      verify(() => mockRemoteAlbumRepo.deleteAlbum('r-stale')).called(1);
    });

    test('skips albums with null linked id without server calls', () async {
      final local = _localAlbum(id: 'l1', name: 'Movies');
      when(() => mockLocalAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [local]);

      await sut.syncLinkedAlbums(UserStub.admin.id);

      verifyNever(() => mockAlbumApiRepo.addAssets(any(), any()));
      verifyNever(() => mockRemoteAlbumRepo.deleteAlbum(any()));
    });
  });
}
