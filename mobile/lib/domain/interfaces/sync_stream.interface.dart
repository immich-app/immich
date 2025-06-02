import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:openapi/api.dart';

abstract interface class ISyncStreamRepository implements IDatabaseRepository {
  Future<void> updateUsersV1(Iterable<SyncUserV1> data);
  Future<void> deleteUsersV1(Iterable<SyncUserDeleteV1> data);

  Future<void> updatePartnerV1(Iterable<SyncPartnerV1> data);
  Future<void> deletePartnerV1(Iterable<SyncPartnerDeleteV1> data);

  Future<void> updateAssetsV1(Iterable<SyncAssetV1> data);
  Future<void> deleteAssetsV1(Iterable<SyncAssetDeleteV1> data);
  Future<void> updateAssetsExifV1(Iterable<SyncAssetExifV1> data);

  Future<void> updatePartnerAssetsV1(Iterable<SyncAssetV1> data);
  Future<void> deletePartnerAssetsV1(Iterable<SyncAssetDeleteV1> data);
  Future<void> updatePartnerAssetsExifV1(Iterable<SyncAssetExifV1> data);

  Future<void> updateAlbumsV1(Iterable<SyncAlbumV1> data);
  Future<void> deleteAlbumsV1(Iterable<SyncAlbumDeleteV1> data);

  // Future<void> updateAlbumAssetsV1(Iterable<SyncAlbumAssetV1> data);
  // Future<void> deleteAlbumAssetsV1(Iterable<SyncAlbumAssetV1> data);

  Future<void> updateAlbumUsersV1(Iterable<SyncAlbumUserV1> data);
  Future<void> deleteAlbumUsersV1(Iterable<SyncAlbumUserDeleteV1> data);
}
