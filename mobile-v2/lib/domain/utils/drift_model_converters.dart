import 'package:immich_mobile/domain/entities/asset.entity.drift.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';

abstract final class DriftModelConverters {
  static Asset toAssetModel(AssetData asset) {
    return Asset(
      id: asset.id,
      name: asset.name,
      hash: asset.hash,
      height: asset.height,
      width: asset.width,
      type: asset.type,
      createdTime: asset.createdTime,
      modifiedTime: asset.modifiedTime,
      duration: asset.duration,
      localId: asset.localId,
      remoteId: asset.remoteId,
      livePhotoVideoId: asset.livePhotoVideoId,
    );
  }
}
