import 'package:immich_mobile/domain/models/album/local_album.model.dart';
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
