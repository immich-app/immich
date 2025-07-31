import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class SharedRemoteAlbum extends RemoteAlbum {
  final List<RemoteAsset> assets;

  const SharedRemoteAlbum({
    required super.id,
    required this.assets,
    required super.name,
    required super.ownerId,
    required super.description,
    required super.createdAt,
    required super.updatedAt,
    super.thumbnailAssetId,
    required super.isActivityEnabled,
    required super.order,
    required super.assetCount,
    required super.ownerName,
  });
}
