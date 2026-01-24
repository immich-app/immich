import 'dart:async';
import 'dart:io';
import 'package:cancellation_token_http/http.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart' as asset_entity;
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/response_extensions.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:share_plus/share_plus.dart';

final assetMediaRepositoryProvider = Provider((ref) => AssetMediaRepository(ref.watch(assetApiRepositoryProvider)));

class AssetMediaRepository {
  final AssetApiRepository _assetApiRepository;
  static final Logger _log = Logger("AssetMediaRepository");

  const AssetMediaRepository(this._assetApiRepository);

  Future<bool> _androidSupportsTrash() async {
    if (Platform.isAndroid) {
      DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      int sdkVersion = androidInfo.version.sdkInt;
      return sdkVersion >= 31;
    }
    return false;
  }

  Future<List<String>> deleteAll(List<String> ids) async {
    if (CurrentPlatform.isAndroid) {
      if (await _androidSupportsTrash()) {
        return PhotoManager.editor.android.moveToTrash(
          ids.map((e) => AssetEntity(id: e, width: 1, height: 1, typeInt: 0)).toList(),
        );
      } else {
        return PhotoManager.editor.deleteWithIds(ids);
      }
    }
    return PhotoManager.editor.deleteWithIds(ids);
  }

  Future<asset_entity.Asset?> get(String id) async {
    final entity = await AssetEntity.fromId(id);
    return toAsset(entity);
  }

  static asset_entity.Asset? toAsset(AssetEntity? local) {
    if (local == null) return null;

    final asset_entity.Asset asset = asset_entity.Asset(
      checksum: "",
      localId: local.id,
      ownerId: fastHash(Store.get(StoreKey.currentUser).id),
      fileCreatedAt: local.createDateTime,
      fileModifiedAt: local.modifiedDateTime,
      updatedAt: local.modifiedDateTime,
      durationInSeconds: local.duration,
      type: asset_entity.AssetType.values[local.typeInt],
      fileName: local.title!,
      width: local.width,
      height: local.height,
      isFavorite: local.isFavorite,
    );

    if (asset.fileCreatedAt.year == 1970) {
      asset.fileCreatedAt = asset.fileModifiedAt;
    }

    if (local.latitude != null) {
      asset.exifInfo = ExifInfo(latitude: local.latitude, longitude: local.longitude);
    }

    asset.local = local;
    return asset;
  }

  Future<String?> getOriginalFilename(String id) async {
    final entity = await AssetEntity.fromId(id);
    if (entity == null) {
      return null;
    }

    try {
      // titleAsync gets the correct original filename for some assets on iOS
      // otherwise using the `entity.title` would return a random GUID
      final originalFilename = await entity.titleAsync;
      // treat empty filename as missing
      return originalFilename.isNotEmpty ? originalFilename : null;
    } catch (e) {
      _log.warning("Failed to get original filename for asset: $id. Error: $e");
      return null;
    }
  }

  /// Deletes temporary files in parallel
  Future<void> _cleanupTempFiles(List<File> tempFiles) async {
    await Future.wait(
      tempFiles.map((file) async {
        try {
          await file.delete();
        } catch (e) {
          _log.warning("Failed to delete temporary file: ${file.path}", e);
        }
      }),
    );
  }

  // TODO: make this more efficient
  Future<int> shareAssets(List<BaseAsset> assets, BuildContext context, {CancellationToken? cancelToken}) async {
    final downloadedXFiles = <XFile>[];
    final tempFiles = <File>[];

    for (var asset in assets) {
      if (cancelToken != null && cancelToken.isCancelled) {
        // if cancelled, delete any temp files created so far
        await _cleanupTempFiles(tempFiles);
        return 0;
      }

      final localId = (asset is LocalAsset)
          ? asset.id
          : asset is RemoteAsset
          ? asset.localId
          : null;

      if (localId != null) {
        File? f = await AssetEntity(id: localId, width: 1, height: 1, typeInt: 0).originFile;
        downloadedXFiles.add(XFile(f!.path));
        if (CurrentPlatform.isIOS) {
          tempFiles.add(f);
        }
      } else if (asset is RemoteAsset) {
        final tempDir = await getTemporaryDirectory();
        final name = asset.name;
        final tempFile = await File('${tempDir.path}/$name').create();
        final res = await _assetApiRepository.downloadAsset(asset.id);

        if (res.statusCode != 200) {
          _log.severe("Download for $name failed", res.toLoggerString());
          continue;
        }

        await tempFile.writeAsBytes(res.bodyBytes);
        downloadedXFiles.add(XFile(tempFile.path));
        tempFiles.add(tempFile);
      } else {
        _log.warning("Asset type not supported for sharing: $asset");
        continue;
      }
    }

    if (downloadedXFiles.isEmpty) {
      _log.warning("No asset can be retrieved for share");
      return 0;
    }

    if (cancelToken != null && cancelToken.isCancelled) {
      await _cleanupTempFiles(tempFiles);
      return 0;
    }

    // we dont want to await the share result since the
    // "preparing" dialog will not disappear until
    final size = context.sizeData;
    unawaited(
      Share.shareXFiles(
        downloadedXFiles,
        sharePositionOrigin: Rect.fromPoints(Offset.zero, Offset(size.width / 3, size.height)),
      ).then((result) async {
        await _cleanupTempFiles(tempFiles);
      }),
    );

    return downloadedXFiles.length;
  }
}