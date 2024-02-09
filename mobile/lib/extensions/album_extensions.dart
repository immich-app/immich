import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

extension LocalAlbumIsarHelper on IsarCollection<LocalAlbum> {
  Future<void> store(LocalAlbum a) async {
    await put(a);
    await a.thumb.save();
    await a.assets.save();
  }
}

extension RemoteAlbumIsarHelper on IsarCollection<RemoteAlbum> {
  Future<void> store(RemoteAlbum a) async {
    await put(a);
    await a.owner.save();
    await a.thumb.save();
    await a.sharedUsers.save();
    await a.assets.save();
  }
}

extension BackupAlbumIsarHelper on IsarCollection<BackupAlbum> {
  Future<void> store(BackupAlbum a) async {
    await put(a);
    await a.album.save();
  }
}

extension AlbumResponseDtoHelper on AlbumResponseDto {
  List<Asset> getAssets() => assets.map(Asset.remote).toList();
}

extension AssetPathEntityHelper on AssetPathEntity {
  String get eTagKeyAssetCount => "device-album-$id-asset-count";
}
