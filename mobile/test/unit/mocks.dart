import 'dart:typed_data';

import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:mocktail/mocktail.dart' as mock;
import 'package:mocktail/mocktail.dart';

import '../domain/service.mock.dart';
import '../infrastructure/repository.mock.dart';
import 'factories/local_album_factory.dart';
import 'factories/local_asset_factory.dart';
import 'factories/remote_album_factory.dart';
import 'factories/user_factory.dart';

class RepositoryMocks {
  final localAlbum = LocalAlbumRepositoryStub(MockLocalAlbumRepository());
  final localAsset = LocalAssetRepositoryStub(MockDriftLocalAssetRepository());
  final trashedAsset = MockTrashedLocalAssetRepository();
  final toast = MockToastRepository();
  final remoteAlbum = MockRemoteAlbumRepository();
  final albumApi = MockDriftAlbumApiRepository();

  final nativeApi = NativeSyncApiStub(MockNativeSyncApi());

  RepositoryMocks() {
    resetAll();
  }

  void resetAll() {
    _registerFallbacks();
    localAlbum.reset();
    localAsset.reset();
    reset(trashedAsset);
    reset(remoteAlbum);
    reset(albumApi);
    nativeApi.reset();
    reset(toast);
    _stubLocalAlbumRepository();
    _stubLocalAssetRepository();
    _stubNativeSyncApi();
  }

  void _stubLocalAlbumRepository() {
    when(localAlbum.getBackupAlbums).thenAnswer((_) async => []);
    when(localAlbum.getAssetsToHash).thenAnswer((_) async => []);
  }

  void _stubLocalAssetRepository() {
    when(localAsset.reconcileHashesFromCloudId).thenAnswer((_) async => {});
    when(localAsset.updateHashes).thenAnswer((_) async => {});
  }

  void _stubNativeSyncApi() {
    when(nativeApi.hashAssets).thenAnswer((_) async => []);
  }
}

class ServiceMocks {
  final partner = PartnerServiceStub(MockPartnerService());
  final user = UserServiceStub(MockUserService());
  final asset = AssetServiceStub(MockAssetService());
  final album = RemoteAlbumServiceStub(MockRemoteAlbumService());
  final cleanup = CleanupServiceStub(MockCleanupService());

  ServiceMocks() {
    resetAll();
  }

  void resetAll() {
    _registerFallbacks();
    partner.reset();
    user.reset();
    asset.reset();
    album.reset();
    cleanup.reset();
    _stubUserService();
    _stubPartnerService();
    _stubAssetService();
    _stubRemoteAlbumService();
    _stubCleanupService();
  }

  void _stubUserService() {
    when(user.getMyUser).thenReturn(UserFactory.createDto());
    when(user.tryGetMyUser).thenReturn(null);
    when(user.watchMyUser).thenAnswer((_) => const Stream.empty());
    when(user.refreshMyUser).thenAnswer((_) async => null);
    when(user.createProfileImage).thenAnswer((_) async => null);
  }

  void _stubPartnerService() {
    registerFallbackValue(PartnerDirection.sharedBy);
    when(partner.getCandidates).thenAnswer((_) => const Stream.empty());
    when(partner.search).thenAnswer((_) => const Stream.empty());
    when(partner.update).thenAnswer((_) async {});
    when(partner.create).thenAnswer((_) async {});
    when(partner.delete).thenAnswer((_) async {});
  }

  void _stubAssetService() {
    when(asset.update).thenAnswer((_) async {});
    when(asset.stack).thenAnswer((_) async {});
    when(asset.unstack).thenAnswer((_) async {});
    when(asset.restoreTrash).thenAnswer((_) async {});
    when(asset.trash).thenAnswer((_) async {});
    when(asset.delete).thenAnswer((_) async {});
  }

  void _stubRemoteAlbumService() {
    when(album.removeAssets).thenAnswer((_) async => 0);
    when(album.updateAlbum).thenAnswer((_) async => RemoteAlbumFactory.create());
  }

  void _stubCleanupService() {
    when(cleanup.deleteLocalAssets).thenAnswer((_) async => 0);
  }

  void _stubRemoteAlbumService() {
    when(album.removeAssets).thenAnswer((_) async => 0);
    when(album.updateAlbum).thenAnswer((_) async => RemoteAlbumFactory.create());
  }
}

void _registerFallbacks() {
  registerFallbackValue(LocalAlbumFactory.create());
  registerFallbackValue(LocalAssetFactory.create());
  registerFallbackValue(Uint8List(0));
  registerFallbackValue(AssetVisibility.timeline);
  registerFallbackValue(const Option<bool>.none());
  registerFallbackValue(const Option<AssetVisibility>.none());
}

extension type const Stub<T extends Mock>(T mockedClass) {
  void reset() => mock.reset(mockedClass);
}

extension type const LocalAlbumRepositoryStub(MockLocalAlbumRepository repo) implements Stub<MockLocalAlbumRepository> {
  Future<List<LocalAlbum>> Function() get getBackupAlbums =>
      () => repo.getBackupAlbums();

  Future<List<LocalAsset>> Function() get getAssetsToHash =>
      () => repo.getAssetsToHash(any());
}

extension type const LocalAssetRepositoryStub(MockDriftLocalAssetRepository repo)
    implements Stub<MockDriftLocalAssetRepository> {
  Future<void> Function() get reconcileHashesFromCloudId =>
      () => repo.reconcileHashesFromCloudId();

  Future<void> Function() get updateHashes =>
      () => repo.updateHashes(any());
}

extension type const PartnerServiceStub(MockPartnerService service) implements Stub<MockPartnerService> {
  Stream<Iterable<User>> Function() get getCandidates =>
      () => service.getCandidates(any());

  Stream<Iterable<Partner>> Function() get search =>
      () => service.search(any(), any());

  Future<void> Function() get create =>
      () => service.create(
        sharedById: any(named: 'sharedById'),
        sharedWithId: any(named: 'sharedWithId'),
        inTimeline: any(named: 'inTimeline'),
      );

  Future<void> Function() get update =>
      () => service.update(
        sharedById: any(named: 'sharedById'),
        sharedWithId: any(named: 'sharedWithId'),
        inTimeline: any(named: 'inTimeline'),
      );

  Future<void> Function() get delete =>
      () => service.delete(
        sharedById: any(named: 'sharedById'),
        sharedWithId: any(named: 'sharedWithId'),
      );
}

extension type const UserServiceStub(MockUserService service) implements Stub<MockUserService> {
  UserDto Function() get getMyUser =>
      () => service.getMyUser();

  UserDto? Function() get tryGetMyUser =>
      () => service.tryGetMyUser();

  Stream<UserDto?> Function() get watchMyUser =>
      () => service.watchMyUser();

  Future<UserDto?> Function() get refreshMyUser =>
      () => service.refreshMyUser();

  Future<String?> Function() get createProfileImage =>
      () => service.createProfileImage(any(), any());
}

extension type const AssetServiceStub(MockAssetService service) implements Stub<MockAssetService> {
  Future<void> Function() get update =>
      () => service.update(
        any(),
        isFavorite: any(named: 'isFavorite'),
        visibility: any(named: 'visibility'),
      );

  Future<void> Function() get stack =>
      () => service.stack(any(), any());

  Future<void> Function() get unstack =>
      () => service.unstack(any());

  Future<void> Function() get restoreTrash =>
      () => service.restoreTrash(any());

  Future<void> Function() get trash =>
      () => service.trash(any());

  Future<void> Function() get delete =>
      () => service.delete(any());
}

extension type const RemoteAlbumServiceStub(MockRemoteAlbumService service) implements Stub<MockRemoteAlbumService> {
  Future<int> Function() get removeAssets =>
      () => service.removeAssets(
        albumId: any(named: 'albumId'),
        assetIds: any(named: 'assetIds'),
      );

  Future<RemoteAlbum> Function() get updateAlbum =>
      () => service.updateAlbum(any(), thumbnailAssetId: any(named: 'thumbnailAssetId'));
}

extension type const CleanupServiceStub(MockCleanupService service) implements Stub<MockCleanupService> {
  Future<int> Function() get deleteLocalAssets =>
      () => service.deleteLocalAssets(any());
}

extension type const RemoteAlbumServiceStub(MockRemoteAlbumService service) implements Stub<MockRemoteAlbumService> {
  Future<int> Function() get removeAssets =>
      () => service.removeAssets(
        albumId: any(named: 'albumId'),
        assetIds: any(named: 'assetIds'),
      );

  Future<RemoteAlbum> Function() get updateAlbum =>
      () => service.updateAlbum(any(), thumbnailAssetId: any(named: 'thumbnailAssetId'));
}

extension type const NativeSyncApiStub(MockNativeSyncApi api) implements Stub<MockNativeSyncApi> {
  Future<List<HashResult>> Function() get hashAssets =>
      () => api.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess'));
}
