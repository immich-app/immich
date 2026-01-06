import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';

typedef _AssetVideoDimension = ({double? width, double? height, bool isFlipped});

class AssetService {
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;

  const AssetService({
    required RemoteAssetRepository remoteAssetRepository,
    required DriftLocalAssetRepository localAssetRepository,
  }) : _remoteAssetRepository = remoteAssetRepository,
       _localAssetRepository = localAssetRepository;

  Future<BaseAsset?> getAsset(BaseAsset asset) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).id;
    return asset is LocalAsset ? _localAssetRepository.get(id) : _remoteAssetRepository.get(id);
  }

  Stream<BaseAsset?> watchAsset(BaseAsset asset) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).id;
    return asset is LocalAsset ? _localAssetRepository.watch(id) : _remoteAssetRepository.watch(id);
  }

  Future<List<LocalAsset?>> getLocalAssetsByChecksum(String checksum) {
    return _localAssetRepository.getByChecksum(checksum);
  }

  Future<RemoteAsset?> getRemoteAssetByChecksum(String checksum) {
    return _remoteAssetRepository.getByChecksum(checksum);
  }

  Future<RemoteAsset?> getRemoteAsset(String id) {
    return _remoteAssetRepository.get(id);
  }

  Future<List<RemoteAsset>> getStack(RemoteAsset asset) async {
    if (asset.stackId == null) {
      return const [];
    }

    final stack = await _remoteAssetRepository.getStackChildren(asset);
    // Include the primary asset in the stack as the first item
    return [asset, ...stack];
  }

  Future<ExifInfo?> getExif(BaseAsset asset) async {
    if (!asset.hasRemote) {
      return null;
    }

    final id = asset is LocalAsset ? asset.remoteId! : (asset as RemoteAsset).id;
    return _remoteAssetRepository.getExif(id);
  }

  Future<double> getAspectRatio(BaseAsset asset) async {
    final dimension = asset is LocalAsset
        ? await _getLocalAssetDimensions(asset)
        : await _getRemoteAssetDimensions(asset as RemoteAsset);

    if (dimension.width == null || dimension.height == null || dimension.height == 0) {
      return 1.0;
    }

    return dimension.isFlipped ? dimension.height! / dimension.width! : dimension.width! / dimension.height!;
  }

  Future<_AssetVideoDimension> _getLocalAssetDimensions(LocalAsset asset) async {
    double? width = asset.width?.toDouble();
    double? height = asset.height?.toDouble();
    int orientation = asset.orientation;

    if (width == null || height == null) {
      final fetched = await _localAssetRepository.get(asset.id);
      width = fetched?.width?.toDouble();
      height = fetched?.height?.toDouble();
      orientation = fetched?.orientation ?? 0;
    }

    // On Android, local assets need orientation correction for 90°/270° rotations
    // On iOS, the Photos framework pre-corrects dimensions
    final isFlipped = CurrentPlatform.isAndroid && (orientation == 90 || orientation == 270);
    return (width: width, height: height, isFlipped: isFlipped);
  }

  Future<_AssetVideoDimension> _getRemoteAssetDimensions(RemoteAsset asset) async {
    double? width = asset.width?.toDouble();
    double? height = asset.height?.toDouble();

    if (width == null || height == null) {
      final fetched = await _remoteAssetRepository.get(asset.id);
      width = fetched?.width?.toDouble();
      height = fetched?.height?.toDouble();
    }

    final exif = await getExif(asset);
    final isFlipped = ExifDtoConverter.isOrientationFlipped(exif?.orientation);
    return (width: width, height: height, isFlipped: isFlipped);
  }

  Future<List<(String, String)>> getPlaces(String userId) {
    return _remoteAssetRepository.getPlaces(userId);
  }

  Future<(int local, int remote)> getAssetCounts() async {
    return (await _localAssetRepository.getCount(), await _remoteAssetRepository.getCount());
  }

  Future<int> getLocalHashedCount() {
    return _localAssetRepository.getHashedCount();
  }

  Future<List<LocalAlbum>> getSourceAlbums(String localAssetId, {BackupSelection? backupSelection}) {
    return _localAssetRepository.getSourceAlbums(localAssetId, backupSelection: backupSelection);
  }
}
