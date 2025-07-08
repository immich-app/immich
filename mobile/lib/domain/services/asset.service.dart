import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';
import 'package:platform/platform.dart';

class AssetService {
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final Platform _platform;

  const AssetService({
    required RemoteAssetRepository remoteAssetRepository,
    required DriftLocalAssetRepository localAssetRepository,
  })  : _remoteAssetRepository = remoteAssetRepository,
        _localAssetRepository = localAssetRepository,
        _platform = const LocalPlatform();

  Stream<BaseAsset?> watchAsset(BaseAsset asset) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).id;
    return asset is LocalAsset
        ? _localAssetRepository.watchAsset(id)
        : _remoteAssetRepository.watchAsset(id);
  }

  Future<ExifInfo?> getExif(BaseAsset asset) async {
    if (!asset.hasRemote) {
      return null;
    }

    final id =
        asset is LocalAsset ? asset.remoteId! : (asset as RemoteAsset).id;
    return _remoteAssetRepository.getExif(id);
  }

  Future<double> getAspectRatio(BaseAsset asset) async {
    bool isFlipped;
    double? width;
    double? height;

    if (asset.hasRemote) {
      final exif = await getExif(asset);
      isFlipped = ExifDtoConverter.isOrientationFlipped(exif?.orientation);
      width = exif?.width ?? asset.width?.toDouble();
      height = exif?.height ?? asset.height?.toDouble();
    } else if (asset is LocalAsset) {
      isFlipped = _platform.isAndroid &&
          (asset.orientation == 90 || asset.orientation == 270);
      width = asset.width?.toDouble();
      height = asset.height?.toDouble();
    } else {
      isFlipped = false;
    }

    final orientedWidth = isFlipped ? height : width;
    final orientedHeight = isFlipped ? width : height;
    if (orientedWidth != null && orientedHeight != null && orientedHeight > 0) {
      return orientedWidth / orientedHeight;
    }

    return 1.0;
  }
}
