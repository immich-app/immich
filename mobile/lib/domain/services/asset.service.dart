import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_exif.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class AssetService {
  final RemoteAssetRepository _remoteRepository;
  final RemoteExifRepository _exifRepository;
  final DriftLocalAssetRepository _localRepository;
  final AssetApiRepository _apiRepository;

  const AssetService({
    required this._remoteRepository,
    required this._exifRepository,
    required this._localRepository,
    required this._apiRepository,
  });

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

  Future<void> restoreTrash(List<String> remoteIds) async {
    if (remoteIds.isEmpty) {
      return;
    }

    await _apiRepository.restoreTrash(remoteIds);
    await _remoteRepository.restoreTrash(remoteIds);
  }

  Future<void> stack(String userId, List<String> remoteIds) async {
    if (remoteIds.isEmpty) {
      return;
    }

    final stack = await _apiRepository.stack(remoteIds);
    await _remoteRepository.stack(userId, stack);
  }

  Future<void> unstack(List<String> stackIds) async {
    if (stackIds.isEmpty) {
      return;
    }

    await _remoteRepository.unStack(stackIds);
    await _apiRepository.unStack(stackIds);
  }

  Future<void> update(
    List<String> remoteIds, {
    Option<bool> isFavorite = const .none(),
    Option<AssetVisibility> visibility = const .none(),
    Option<LatLng> location = const .none(),
    Option<String> dateTime = const .none(),
  }) async {
    if (remoteIds.isEmpty) {
      return;
    }

    final parsedDateTime = dateTime.map((dt) => DateTime.parse(dt));
    final offset = RegExp(r'[+-]\d{2}:\d{2}$').firstMatch(dateTime.unwrapOrNull ?? '')?.group(0);

    await _apiRepository.update(
      remoteIds,
      isFavorite: isFavorite,
      visibility: visibility,
      location: location,
      dateTimeOriginal: dateTime,
    );
    await _remoteRepository.update(
      remoteIds,
      isFavorite: isFavorite,
      visibility: visibility,
      createdAt: parsedDateTime,
    );
    await _exifRepository.update(
      remoteIds,
      location: location,
      dateTimeOriginal: parsedDateTime,
      timeZone: .fromNullable(offset).map((o) => 'UTC$o'),
    );
  }

  Future<void> trash(List<String> remoteIds) async {
    if (remoteIds.isEmpty) {
      return;
    }

    await _apiRepository.delete(remoteIds, false);
    await _remoteRepository.trash(remoteIds);
  }

  Future<void> delete(List<String> remoteIds) async {
    if (remoteIds.isEmpty) {
      return;
    }

    await _apiRepository.delete(remoteIds, true);
    await _remoteRepository.delete(remoteIds);
  }

  Future<void> applyEdits(String remoteId, List<AssetEdit> edits) async {
    if (edits.isEmpty) {
      await _apiRepository.removeEdits(remoteId);
    } else {
      await _apiRepository.editAsset(remoteId, edits);
    }
  }

  // TODO(shenlong): remove after action migration
  Future<LocalAsset?> getLocalAsset(String id) {
    return _localRepository.get(id);
  }

  Future<void> updateFavorite(List<String> remoteIds, bool isFavorite) async {
    if (remoteIds.isEmpty) {
      return;
    }

    await _apiRepository.updateFavorite(remoteIds, isFavorite);
    await _remoteRepository.updateFavorite(remoteIds, isFavorite);
  }
}
