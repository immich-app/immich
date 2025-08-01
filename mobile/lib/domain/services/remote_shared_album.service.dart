import 'dart:async';

import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/domain/models/album/shared_album.model.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';

class RemoteSharedAlbumService {
  final DriftAlbumApiRepository _albumApiRepository;
  final AssetApiRepository _assetApiRepository;

  const RemoteSharedAlbumService(this._albumApiRepository, this._assetApiRepository);

  Future<SharedRemoteAlbum?> getSharedAlbum(String albumId) {
    return _albumApiRepository.getShared(albumId);
  }

  Future<int> uploadAssets(String albumId, List<XFile> files) async {
    // Start all uploads concurrently
    final uploadFutures = files.map((file) => _assetApiRepository.uploadAsset(file)).toList();

    // Wait for all uploads to complete
    final assetIds = await Future.wait(uploadFutures);

    // Filter out null assetIds
    final completedUploads = assetIds.whereType<String>().toList();

    if (completedUploads.isNotEmpty) {
      await _albumApiRepository.addAssets(albumId, completedUploads);
    }

    return completedUploads.length;
  }
}
