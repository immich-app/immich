import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

typedef AssetSource = Future<BaseAsset> Function(String id);

class AssetService {
  final AssetSource _assetSource;

  AssetService({
    required AssetSource assetSource,
  })  : _assetSource = assetSource;

  factory AssetService.remoteAsset({
    required IRemoteAssetRepository repository,
  }) {
    return AssetService(
      assetSource: (String id) => repository.getAsset(id),
    );
  }

  factory AssetService.localAsset({
    required ILocalAssetRepository repository,
  }) {
    return AssetService(
      assetSource: (String id) => repository.getAsset(id),
    );
  }

  Future<BaseAsset> getAsset(String id) async {
    return await _assetSource(id);
  }
}
