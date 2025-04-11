import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:photo_manager/photo_manager.dart';

abstract interface class IAlbumMediaRepository {
  Future<List<AssetPathEntity>> getAll({PMFilter? filter});

  Future<List<LocalAsset>> getAssetsForAlbum(AssetPathEntity album);

  Future<AssetPathEntity> refresh(String albumId, {PMFilter? filter});
}
