import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final assetApiRepositoryProvider = Provider(
  (ref) => AssetApiRepository(
    ref.watch(apiServiceProvider).assetsApi,
    ref.watch(apiServiceProvider).searchApi,
  ),
);

class AssetApiRepository extends ApiRepository implements IAssetApiRepository {
  final AssetsApi _api;
  final SearchApi _searchApi;

  AssetApiRepository(this._api, this._searchApi);

  @override
  Future<Asset> update(String id, {String? description}) async {
    final response = await checkNull(
      _api.updateAsset(id, UpdateAssetDto(description: description)),
    );
    return Asset.remote(response);
  }

  @override
  Future<List<Asset>> search({List<String> personIds = const []}) async {
    // TODO this always fetches all assets, change API and usage to actually do pagination
    final List<Asset> result = [];
    bool hasNext = true;
    int currentPage = 1;
    while (hasNext) {
      final response = await checkNull(
        _searchApi.searchMetadata(
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
}
