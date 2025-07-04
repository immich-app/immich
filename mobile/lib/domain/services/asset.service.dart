import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';

class AssetService {
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;

  const AssetService({
    required RemoteAssetRepository remoteAssetRepository,
    required DriftLocalAssetRepository localAssetRepository,
  })  : _remoteAssetRepository = remoteAssetRepository,
        _localAssetRepository = localAssetRepository;

  Stream<BaseAsset?> watchAsset(BaseAsset asset) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).id;
    return asset is LocalAsset
        ? _localAssetRepository.watchAsset(id)
        : _remoteAssetRepository.watchAsset(id);
  }

  Future<ExifInfo?> getExif(BaseAsset asset) async {
    if (asset is LocalAsset || asset is! RemoteAsset) {
      return null;
    }

    return _remoteAssetRepository.getExif(asset.id);
  }
}
