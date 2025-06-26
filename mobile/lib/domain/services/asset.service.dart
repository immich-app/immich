import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';

class AssetService {
  final DriftRemoteAssetRepository _remoteAssetRepository;

  const AssetService({
    required DriftRemoteAssetRepository remoteAssetRepository,
  }) : _remoteAssetRepository = remoteAssetRepository;

  Future<ExifInfo?> getExif(BaseAsset asset) async {
    if (asset is LocalAsset || asset is! Asset) {
      return null;
    }

    return _remoteAssetRepository.getExif(asset.id);
  }
}
