import 'package:immich_mobile/domain/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AssetApiRepository extends ApiRepository implements IAssetApiRepository {
  final Logger _logger = Logger('AssetApiRepository');
  final ApiService _api;
  AssetApiRepository(this._api);

  @override
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
  ) async {
    return await _api.assetsApi.updateAssets(
      AssetBulkUpdateDto(
        dateTimeOriginal: dateTimeOriginal,
        description: description,
        duplicateId: duplicateId,
        ids: assetIds,
        isFavorite: isFavorite,
        latitude: latitude,
        longitude: longitude,
        rating: rating,
        visibility: visibility,
      ),
    );
  }

  @override
  Future<void> deleteAssets(bool force, List<String> assetIds) async {
    return await _api.assetsApi.deleteAssets(
      AssetBulkDeleteDto(
        force: force,
        ids: assetIds,
      ),
    );
  }
}
