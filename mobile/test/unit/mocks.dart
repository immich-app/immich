import 'dart:typed_data';

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:mocktail/mocktail.dart' as mock;
import 'package:mocktail/mocktail.dart';

import '../domain/service.mock.dart';
import '../infrastructure/repository.mock.dart';
import '../repository.mocks.dart';
import 'factories/local_album_factory.dart';
import 'factories/local_asset_factory.dart';
import 'factories/remote_album_factory.dart';
import 'factories/user_factory.dart';

class RepositoryMocks {
  final localAlbum = LocalAlbumRepositoryStub(MockLocalAlbumRepository());
  final localAsset = LocalAssetRepositoryStub(MockDriftLocalAssetRepository());
  final remoteAsset = RemoteAssetRepositoryStub(MockRemoteAssetRepository());
  final remoteExif = RemoteExifRepositoryStub(MockRemoteExifRepository());
  final trashedAsset = MockTrashedLocalAssetRepository();
  final toast = MockToastRepository();
  final remoteAlbum = MockRemoteAlbumRepository();
  final albumApi = MockDriftAlbumApiRepository();

  final nativeApi = NativeSyncApiStub(MockNativeSyncApi());
  final assetApi = AssetApiRepositoryStub(MockAssetApiRepository());
  final assetMedia = AssetMediaRepositoryStub(MockAssetMediaRepository());
  final download = DownloadRepositoryStub(MockDownloadRepository());

  RepositoryMocks() {
    resetAll();
  }

  void resetAll() {
    _registerFallbacks();
    localAlbum.reset();
    localAsset.reset();
    remoteAsset.reset();
    remoteExif.reset();
    reset(trashedAsset);
    reset(remoteAlbum);
    reset(albumApi);
    nativeApi.reset();
    assetApi.reset();
    assetMedia.reset();
    download.reset();
    reset(toast);
    _stubLocalAlbumRepository();
    _stubLocalAssetRepository();
    _stubRemoteAssetRepository();
    _stubRemoteExifRepository();
    _stubNativeSyncApi();
    _stubAssetApiRepository();
    _stubAssetMediaRepository();
    _stubDownloadRepository();
  }

  void _stubRemoteAssetRepository() {
    when(remoteAsset.getExif).thenAnswer((_) async => null);
    when(remoteAsset.getAssetEdits).thenAnswer((_) async => const []);
    when(remoteAsset.update).thenAnswer((_) async {});
  }

  void _stubRemoteExifRepository() {
    when(remoteExif.update).thenAnswer((_) async {});
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

  void _stubAssetApiRepository() {
    when(assetApi.update).thenAnswer((_) async => {});
  }

  void _stubAssetMediaRepository() {
    when(assetMedia.shareAssets).thenAnswer((_) async => 1);
  }

  void _stubDownloadRepository() {
    when(download.downloadAllAssets).thenAnswer((_) async => const []);
  }
}

class ServiceMocks {
  final partner = PartnerServiceStub(MockPartnerService());
  final user = UserServiceStub(MockUserService());
  final asset = AssetServiceStub(MockAssetService());
  final album = RemoteAlbumServiceStub(MockRemoteAlbumService());
  final cleanup = CleanupServiceStub(MockCleanupService());
  final tag = TagServiceStub(MockTagService());
  final backgroundSync = MockBackgroundSyncManager();
  final upload = MockForegroundUploadService();

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
    tag.reset();
    reset(backgroundSync);
    reset(upload);
    _stubUserService();
    _stubPartnerService();
    _stubAssetService();
    _stubRemoteAlbumService();
    _stubCleanupService();
    _stubTagService();
    _stubBackgroundSync();
    _stubForegroundUpload();
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
    when(asset.applyEdits).thenAnswer((_) async {});
  }

  void _stubRemoteAlbumService() {
    when(album.removeAssets).thenAnswer((_) async => 0);
    when(album.updateAlbum).thenAnswer((_) async => RemoteAlbumFactory.create());
  }

  void _stubCleanupService() {
    when(cleanup.deleteLocalAssets).thenAnswer((_) async => 0);
  }

  void _stubTagService() {
    when(tag.bulkTagAssets).thenAnswer((_) async => 0);
    when(tag.upsertTags).thenAnswer((_) async => const []);
    when(tag.getAllTags).thenAnswer((_) async => const {});
  }

  void _stubBackgroundSync() {
    when(() => backgroundSync.syncLocal()).thenAnswer((_) async {});
    when(() => backgroundSync.hashAssets()).thenAnswer((_) async {});
  }

  void _stubForegroundUpload() {
    when(
      () => upload.uploadManual(any(), cancelToken: any(named: 'cancelToken'), callbacks: any(named: 'callbacks')),
    ).thenAnswer((_) async {});
  }
}

void _registerFallbacks() {
  registerFallbackValue(LocalAlbumFactory.create());
  registerFallbackValue(LocalAssetFactory.create());
  registerFallbackValue(Uint8List(0));
  registerFallbackValue(AssetVisibility.timeline);
  registerFallbackValue(const LatLng(0, 0));
  registerFallbackValue(<AssetEdit>[]);
  registerFallbackValue(const Option<bool>.none());
  registerFallbackValue(const Option<AssetVisibility>.none());
  registerFallbackValue(const Option<LatLng>.none());
  registerFallbackValue(const Option<String>.none());
  registerFallbackValue(const Option<DateTime>.none());
  registerFallbackValue(<BaseAsset>[]);
  registerFallbackValue(<RemoteAsset>[]);
  registerFallbackValue(<LocalAsset>[]);
  registerFallbackValue(ShareAssetType.original);
  registerFallbackValue(const UploadCallbacks());
  registerFallbackValue(_FakeBuildContext());
}

class _FakeBuildContext extends Fake implements BuildContext {}

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

extension type const RemoteAssetRepositoryStub(MockRemoteAssetRepository repo)
    implements Stub<MockRemoteAssetRepository> {
  Future<ExifInfo?> Function() get getExif =>
      () => repo.getExif(any());

  Future<List<AssetEdit>> Function() get getAssetEdits =>
      () => repo.getAssetEdits(any());

  Future<void> Function() get update =>
      () => repo.update(
        any(),
        isFavorite: any(named: 'isFavorite'),
        visibility: any(named: 'visibility'),
        createdAt: any(named: 'createdAt'),
      );
}

extension type const RemoteExifRepositoryStub(MockRemoteExifRepository repo) implements Stub<MockRemoteExifRepository> {
  Future<void> Function() get update =>
      () => repo.update(
        any(),
        dateTimeOriginal: any(named: 'dateTimeOriginal'),
        timeZone: any(named: 'timeZone'),
        location: any(named: 'location'),
      );
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
        dateTime: any(named: 'dateTime'),
        location: any(named: 'location'),
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

  Future<void> Function() get applyEdits =>
      () => service.applyEdits(any(), any());
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

extension type const NativeSyncApiStub(MockNativeSyncApi api) implements Stub<MockNativeSyncApi> {
  Future<List<HashResult>> Function() get hashAssets =>
      () => api.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess'));
}

extension type const AssetApiRepositoryStub(MockAssetApiRepository api) implements Stub<MockAssetApiRepository> {
  Future<void> Function() get update =>
      () => api.update(
        any(),
        isFavorite: any(named: 'isFavorite'),
        visibility: any(named: 'visibility'),
        dateTimeOriginal: any(named: 'dateTimeOriginal'),
        location: any(named: 'location'),
      );
}

extension type const AssetMediaRepositoryStub(MockAssetMediaRepository api) implements Stub<MockAssetMediaRepository> {
  Future<int> Function() get shareAssets =>
      () => api.shareAssets(
        any(),
        any(),
        fileType: any(named: 'fileType'),
        cancelCompleter: any(named: 'cancelCompleter'),
        onAssetDownloadProgress: any(named: 'onAssetDownloadProgress'),
      );
}

extension type const DownloadRepositoryStub(MockDownloadRepository repo) implements Stub<MockDownloadRepository> {
  Future<List<bool>> Function() get downloadAllAssets =>
      () => repo.downloadAllAssets(any());
}

extension type const TagServiceStub(MockTagService service) implements Stub<MockTagService> {
  Future<int> Function() get bulkTagAssets =>
      () => service.bulkTagAssets(any(), any());

  Future<List<Tag>> Function() get upsertTags =>
      () => service.upsertTags(any());

  Future<Set<Tag>> Function() get getAllTags =>
      () => service.getAllTags();
}
