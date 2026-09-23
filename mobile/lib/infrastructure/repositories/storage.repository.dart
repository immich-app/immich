// ignore_for_file: avoid_slow_async_io

import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';

typedef AssetFile = ({File file, String? originalFileName, bool isLivePhoto});

class StorageRepository extends AssetMediaFlutterApi {
  final AssetMediaApi _assetMediaApi;
  final Future<Directory> Function() _cacheDirectory;
  final Directory _temporaryDirectory;
  final _progress = <String, void Function(double)>{};
  final log = Logger('StorageRepository');

  StorageRepository(this._assetMediaApi, {Future<Directory> Function()? cacheDirectory, Directory? temporaryDirectory})
    : _cacheDirectory = cacheDirectory ?? getApplicationCacheDirectory,
      _temporaryDirectory = temporaryDirectory ?? Directory.systemTemp;

  @override
  void onFileProgress(String id, double progress) => _progress[id]?.call(progress);

  Future<AssetFile?> getFileForAsset(String assetId, {void Function(double)? onProgress}) =>
      _getFile(assetId, AssetMediaFileKind.original, "file for asset $assetId", onProgress);

  Future<AssetFile?> getMotionFileForAsset(LocalAsset asset, {void Function(double)? onProgress}) => _getFile(
    asset.id,
    AssetMediaFileKind.livePhotoVideo,
    "motion file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
    onProgress,
  );

  Future<AssetFile?> _getFile(
    String id,
    AssetMediaFileKind kind,
    String label,
    void Function(double)? onProgress,
  ) async {
    if (onProgress != null) {
      // the sync isolates build this repository too and cannot register message handlers
      AssetMediaFlutterApi.setUp(this);
      _progress[id] = onProgress;
    }

    try {
      final result = await _assetMediaApi.getFile(id, kind);
      if (result == null) {
        log.warning("Cannot get $label");
        return null;
      }

      final file = File(result.path);
      final exists = await file.exists();
      if (!exists) {
        log.warning("$label does not exist");
        return null;
      }
      return (file: file, originalFileName: result.originalFileName?.nullIfEmpty, isLivePhoto: result.isLivePhoto);
    } catch (error, stackTrace) {
      log.warning("Error getting $label", error, stackTrace);
      return null;
    } finally {
      if (onProgress != null) {
        _progress.remove(id);
      }
    }
  }

  Future<void> clearCache() async {
    if (!CurrentPlatform.isIOS) {
      return;
    }

    try {
      // older builds wiped tmp itself and background_downloader writes every upload body in it
      await _temporaryDirectory.create();
      final cache = await _cacheDirectory();
      final originals = Directory('${cache.path}/immich/originals');
      if (await originals.exists()) {
        await for (final file in originals.list()) {
          await file.delete();
        }
      }
    } catch (error, stackTrace) {
      log.warning("Error clearing cache", error, stackTrace);
    }
  }
}
