import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/base_api.repository.dart';
import 'package:openapi/api.dart';

final assetApiRepositoryProvider = Provider(
  (ref) => AssetApiRepository(ref.watch(apiServiceProvider).assetsApi),
);

class AssetApiRepository extends BaseApiRepository
    implements IAssetApiRepository {
  final AssetsApi _api;

  AssetApiRepository(this._api);

  @override
  Future<Asset> update(String id, {String? description}) async {
    final response = await checkNull(
      _api.updateAsset(id, UpdateAssetDto(description: description)),
    );
    return Asset.remote(response);
  }
}
