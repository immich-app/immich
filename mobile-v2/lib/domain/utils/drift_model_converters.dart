import 'package:immich_mobile/domain/entities/asset.entity.drift.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';

class DriftModelConverters {
  static Asset toAssetModel(AssetData asset) {
    return Asset(
      id: asset.id,
      localId: asset.localId,
      remoteId: asset.remoteId,
      name: asset.name,
      type: asset.type,
      hash: asset.hash,
      createdTime: asset.createdTime,
      modifiedTime: asset.modifiedTime,
      height: asset.height,
      width: asset.width,
      livePhotoVideoId: asset.livePhotoVideoId,
      duration: asset.duration,
    );
  }
}
