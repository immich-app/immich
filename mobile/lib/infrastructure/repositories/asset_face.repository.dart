import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset_face.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftAssetFaceRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftAssetFaceRepository(this._db) : super(_db);

  Future<List<AssetFace>> getAll() {
    return _db.assetFaceEntity.select().map((assetFace) => assetFace.toDto()).get();
  }
}

extension on AssetFaceEntityData {
  AssetFace toDto() {
    return AssetFace(
      id: id,
      assetId: assetId,
      personId: personId,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
      boundingBoxX1: boundingBoxX1,
      boundingBoxY1: boundingBoxY1,
      boundingBoxX2: boundingBoxX2,
      boundingBoxY2: boundingBoxY2,
      sourceType: sourceType,
    );
  }
}
