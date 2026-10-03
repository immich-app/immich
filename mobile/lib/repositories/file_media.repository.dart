import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:path/path.dart' as p;

final fileMediaRepositoryProvider = Provider((ref) => FileMediaRepository(ref.watch(assetMediaApiProvider)));

class FileMediaRepository {
  final AssetMediaApi _assetMediaApi;

  const FileMediaRepository(this._assetMediaApi);

  Future<bool> saveFile(String path, {String? title, String? relativePath, bool isVideo = false}) async {
    await _assetMediaApi.saveFile(path, title ?? p.basename(path), isVideo, relativePath);
    return true;
  }

  Future<bool> saveLivePhoto({required File image, required File video, required String title}) async {
    await _assetMediaApi.saveLivePhoto(image.path, video.path, title);
    return true;
  }
}
