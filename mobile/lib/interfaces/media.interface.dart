import 'dart:io';
import 'dart:typed_data';

import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

abstract interface class IMediaRepository {
  Future<List<Album>> getAllAlbums();

  Future<List<String>> getAssetIdsByAlbumId(String albumId);

  Future<int> countAssetsInAlbum(String albumId);

  Future<List<Asset>> getAssetsByAlbumId(
    String albumId, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
    bool orderByModificationDate = false,
  });

  Future<Album> getAlbumById(String id);

  Future<Asset?> saveImage(
    Uint8List data, {
    required String title,
    String? relativePath,
  });

  Future<Asset?> saveVideo(
    File file, {
    required String title,
    String? relativePath,
  });

  Future<Asset?> saveLivePhoto({
    required File image,
    required File video,
    required String title,
  });

  Future<List<String>> deleteAssets(List<String> ids);

  Future<Asset?> getAssetById(String id);

  Future<void> clearFileCache();

  Future<void> enableBackgroundAccess();

  Future<void> requestExtendedPermissions();
}
