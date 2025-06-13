import 'package:openapi/api.dart';

abstract interface class IAssetApiRepository {
  Future<void> updateAssets(
    String? dateTimeOriginal,
    String? description,
    String? duplicateId,
    List<String> assetIds,
    bool? isFavorite,
    int? latitude,
    int? longitude,
    int? rating,
    AssetVisibility? visibility,
  );

  Future<void> deleteAssets(bool force, List<String> assetIds);
}
