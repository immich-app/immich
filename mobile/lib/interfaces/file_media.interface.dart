import 'dart:io';
import 'dart:typed_data';

import 'package:immich_mobile/entities/asset.entity.dart';

abstract interface class IFileMediaRepository {
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

  Future<void> clearFileCache();

  Future<void> enableBackgroundAccess();

  Future<void> requestExtendedPermissions();
}
