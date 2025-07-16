import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

final assetApiRepositoryProvider = Provider(
  (ref) => AssetApiRepository(
    ref.watch(apiServiceProvider).assetsApi,
    ref.watch(apiServiceProvider).searchApi,
  ),
);

class AssetApiRepository extends ApiRepository {
  final AssetsApi _api;
  final SearchApi _searchApi;

  AssetApiRepository(this._api, this._searchApi);

  Future<Asset> update(String id, {String? description}) async {
    final response = await checkNull(
      _api.updateAsset(id, UpdateAssetDto(description: description)),
    );
    return Asset.remote(response);
  }

  Future<List<Asset>> search({List<String> personIds = const []}) async {
    // TODO this always fetches all assets, change API and usage to actually do pagination
    final List<Asset> result = [];
    bool hasNext = true;
    int currentPage = 1;
    while (hasNext) {
      final response = await checkNull(
        _searchApi.searchAssets(
          MetadataSearchDto(
            personIds: personIds,
            page: currentPage,
            size: 1000,
          ),
        ),
      );
      result.addAll(response.assets.items.map(Asset.remote));
      hasNext = response.assets.nextPage != null;
      currentPage++;
    }
    return result;
  }

  Future<void> delete(List<String> ids, bool force) async {
    return _api.deleteAssets(AssetBulkDeleteDto(ids: ids, force: force));
  }

  Future<void> updateVisibility(
    List<String> ids,
    AssetVisibilityEnum visibility,
  ) async {
    return _api.updateAssets(
      AssetBulkUpdateDto(ids: ids, visibility: _mapVisibility(visibility)),
    );
  }

  Future<void> updateFavorite(
    List<String> ids,
    bool isFavorite,
  ) async {
    return _api.updateAssets(
      AssetBulkUpdateDto(ids: ids, isFavorite: isFavorite),
    );
  }

  Future<void> updateLocation(
    List<String> ids,
    LatLng location,
  ) async {
    return _api.updateAssets(
      AssetBulkUpdateDto(
        ids: ids,
        latitude: location.latitude,
        longitude: location.longitude,
      ),
    );
  }

  _mapVisibility(AssetVisibilityEnum visibility) => switch (visibility) {
        AssetVisibilityEnum.timeline => AssetVisibility.timeline,
        AssetVisibilityEnum.hidden => AssetVisibility.hidden,
        AssetVisibilityEnum.locked => AssetVisibility.locked,
        AssetVisibilityEnum.archive => AssetVisibility.archive,
      };

  Future<String?> getAssetMIMEType(String assetId) async {
    final response = await checkNull(_api.getAssetInfo(assetId));

    // we need to get the MIME of the thumbnail once that gets added to the API
    return response.originalMimeType;
  }
}
