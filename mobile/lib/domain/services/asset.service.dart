import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/asset_api.interface.dart';
import 'package:logging/logging.dart';

class AssetService {
  final Logger _logger = Logger("AssetService");
  final ILocalAssetRepository _localAssetRepository;
  final IRemoteAssetRepository _remoteAssetRepository;
  final IAssetApiRepository _assetApiRepository;

  AssetService({
    required ILocalAssetRepository localAssetRepository,
    required IRemoteAssetRepository remoteAssetRepository,
    required IAssetApiRepository assetApiRepository,
  })  : _localAssetRepository = localAssetRepository,
        _remoteAssetRepository = remoteAssetRepository,
        _assetApiRepository = assetApiRepository;
}
