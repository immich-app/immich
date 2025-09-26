import 'dart:io';

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

  Future<List<String>> deleteAll(List<String> ids) async {
    if (CurrentPlatform.isIOS) {
      return PhotoManager.editor.deleteWithIds(ids);
    } else if (CurrentPlatform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt < 30) {
        return PhotoManager.editor.deleteWithIds(ids);
      }
      return PhotoManager.editor.android.moveToTrash(
        // Only the id is needed
        ids.map((id) => AssetEntity(id: id, width: 1, height: 1, typeInt: 0)).toList(),
      );
    }
    return [];
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

    // titleAsync gets the correct original filename for some assets on iOS
    // otherwise using the `entity.title` would return a random GUID
    return await entity.titleAsync;
  }

  // TODO: make this more efficient
  Future<int> shareAssets(List<BaseAsset> assets, BuildContext context) async {
    final downloadedXFiles = <XFile>[];

    for (var asset in assets) {
      final localId = (asset is LocalAsset)
          ? asset.id
          : asset is RemoteAsset
          ? asset.localId
          : null;
      if (localId != null) {
        File? f = await AssetEntity(id: localId, width: 1, height: 1, typeInt: 0).originFile;
        downloadedXFiles.add(XFile(f!.path));
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
      } else {
        _log.warning("Asset type not supported for sharing: $asset");
        continue;
      }
    }

    if (downloadedXFiles.isEmpty) {
      _log.warning("No asset can be retrieved for share");
      return 0;
    }

    // we dont want to await the share result since the
    // "preparing" dialog will not disappear until
    final size = context.sizeData;
    Share.shareXFiles(
      downloadedXFiles,
      sharePositionOrigin: Rect.fromPoints(Offset.zero, Offset(size.width / 3, size.height)),
    ).then((result) async {
      for (var file in downloadedXFiles) {
        try {
          await File(file.path).delete();
        } catch (e) {
          _log.warning("Failed to delete temporary file: ${file.path}", e);
        }
      }
    });

    return downloadedXFiles.length;
  }
}
