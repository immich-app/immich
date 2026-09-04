import 'mockito_targets.handles.dart';

class RepositoryMocks {
  final localAlbum = LocalAlbumRepositoryMock();
  final localAsset = LocalAssetRepositoryMock();
  final trashedAsset = TrashedLocalAssetRepositoryMock();
  final nativeApi = NativeSyncApiMock();
  final partnerApi = PartnerApiRepositoryMock();
}

class ServiceMocks {
  final asset = AssetServiceMock();
  final cast = GCastServiceMock();
  final timeline = TimelineServiceMock();
}
