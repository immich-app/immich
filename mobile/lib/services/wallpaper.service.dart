import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/platform/use_as_wallpaper_api.g.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:photo_manager/photo_manager.dart';

final wallpaperServiceProvider = Provider<WallpaperService>(
  (ref) => WallpaperService(ref.watch(assetApiRepositoryProvider)),
);

class WallpaperService {
  final AssetApiRepository _assetApiRepository;
  final Logger _log = Logger("WallpaperService");
  final UseAsWallpaperApi _wallpaperApi = UseAsWallpaperApi();

  WallpaperService(this._assetApiRepository);

  /// Sets the given asset as wallpaper.
  /// Returns true if the wallpaper intent was launched successfully.
  /// Note: This only works on Android.
  Future<bool> setAsWallpaper(BaseAsset asset) async {
    // TODO: Implement iOS support
    if (!Platform.isAndroid) {
      _log.warning('Set as wallpaper is currently only supported on Android');
      return false;
    }

    if (!asset.isImage) {
      _log.warning('Cannot set non-image asset as wallpaper');
      return false;
    }

    try {
      final filePath = await _getAssetFilePath(asset);
      if (filePath == null) {
        _log.severe('Failed to get file path for asset');
        return false;
      }

      final result = await _wallpaperApi.useAsWallpaper(filePath: filePath);

      // Clean up temp file if it was a remote asset
      if (asset is RemoteAsset && asset.localId == null) {
        await _cleanupTempFile(filePath);
      }

      return result;
    } catch (e, stack) {
      _log.severe('Failed to set wallpaper', e, stack);
      return false;
    }
  }

  /// Gets the file path for an asset.
  /// For local assets, retrieves the original file path.
  /// For remote assets, downloads to a temp file and returns the path.
  Future<String?> _getAssetFilePath(BaseAsset asset) async {
    // Try to get local file first
    final localId = asset is LocalAsset
        ? asset.id
        : asset is RemoteAsset
        ? asset.localId
        : null;

    if (localId != null) {
      try {
        final assetEntity = AssetEntity(id: localId, width: 1, height: 1, typeInt: 0);
        final file = await assetEntity.originFile;
        if (file != null && await file.exists()) {
          return file.path;
        }
      } catch (e) {
        _log.warning('Failed to get local file for asset: $e');
      }
    }

    // Download remote asset to temp file
    if (asset is RemoteAsset) {
      return await _downloadToTempFile(asset);
    }

    return null;
  }

  /// Downloads a remote asset to a temp file and returns the path.
  Future<String?> _downloadToTempFile(RemoteAsset asset) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/wallpaper_${asset.id}_${asset.name}');

      final res = await _assetApiRepository.downloadAsset(asset.id);

      if (res.statusCode != 200) {
        _log.severe('Failed to download asset for wallpaper: ${res.statusCode}');
        return null;
      }

      await tempFile.writeAsBytes(res.bodyBytes);
      return tempFile.path;
    } catch (e, stack) {
      _log.severe('Failed to download asset for wallpaper', e, stack);
      return null;
    }
  }

  /// Cleans up a temp file after it's no longer needed.
  Future<void> _cleanupTempFile(String filePath) async {
    try {
      final file = File(filePath);
      if (await file.exists()) {
        // Delay cleanup slightly to allow the system to read the file
        await Future.delayed(const Duration(seconds: 5));
        await file.delete();
      }
    } catch (e) {
      _log.warning('Failed to cleanup temp file: $e');
    }
  }
}
