import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';

class AssetService {
  final RemoteAssetRepository _remoteRepository;
  final DriftLocalAssetRepository _localRepository;
  final AssetApiRepository _apiRepository;

  const AssetService({required this._remoteRepository, required this._localRepository, required this._apiRepository});

  Future<BaseAsset?> getAsset(BaseAsset asset) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).id;
    return asset is LocalAsset ? _localRepository.get(id) : _remoteRepository.get(id);
  }

  Stream<BaseAsset?> watchAsset(BaseAsset asset) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).id;
    return asset is LocalAsset ? _localRepository.watch(id) : _remoteRepository.watch(id);
  }

  Future<List<LocalAsset?>> getLocalAssetsByChecksum(String checksum) {
    return _localRepository.getByChecksum(checksum);
  }

  Future<LocalAsset?> getLocalAsset(String id) {
    return _localRepository.get(id);
  }

  Future<RemoteAsset?> getRemoteAssetByChecksum(String checksum) {
    return _remoteRepository.getByChecksum(checksum);
  }

  Future<RemoteAsset?> getRemoteAsset(String id) {
    return _remoteRepository.get(id);
  }

  Future<List<RemoteAsset>> getStack(RemoteAsset asset) async {
    if (asset.stackId == null) {
      return const [];
    }

    final stack = await _remoteRepository.getStackChildren(asset);
    // Include the primary asset in the stack as the first item
    return [asset, ...stack];
  }

  Future<ExifInfo?> getExif(BaseAsset asset) async {
    if (!asset.hasRemote) {
      return null;
    }

    final id = asset is LocalAsset ? asset.remoteId! : (asset as RemoteAsset).id;
    return _remoteRepository.getExif(id);
  }

  Future<List<(String, String)>> getPlaces(String userId) {
    return _remoteRepository.getPlaces(userId);
  }

  Future<(int local, int remote)> getAssetCounts() async {
    return (await _localRepository.getCount(), await _remoteRepository.getCount());
  }

  Future<int> getLocalHashedCount() {
    return _localRepository.getHashedCount();
  }

  Future<List<LocalAlbum>> getSourceAlbums(String localAssetId, {BackupSelection? backupSelection}) {
    return _localRepository.getSourceAlbums(localAssetId, backupSelection: backupSelection);
  }

  Future<void> updateFavorite(List<String> remoteIds, bool isFavorite) async {
    if (remoteIds.isEmpty) {
      return;
    }

    await _apiRepository.updateFavorite(remoteIds, isFavorite);
    await _remoteRepository.updateFavorite(remoteIds, isFavorite);
  }
}
