import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/auth.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/providers/domain/auth.provider.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final assetMediaRepositoryProvider = Provider(
  (ref) => AssetMediaRepository(authService: ref.watch(authServiceProvider)),
);

class AssetMediaRepository implements IAssetMediaRepository {
  // TODO: Ugly, remove it while refactoring
  final AuthService _authService;

  const AssetMediaRepository({required AuthService authService})
      : _authService = authService;

  @override
  Future<List<String>> deleteAll(List<String> ids) =>
      PhotoManager.editor.deleteWithIds(ids);

  @override
  Future<Asset?> get(String id) async {
    final entity = await AssetEntity.fromId(id);
    return toAsset(entity, _authService);
  }

  static Asset? toAsset(AssetEntity? local, AuthService authService) {
    if (local == null) return null;
    final Asset asset = Asset(
      checksum: "",
      localId: local.id,
      ownerId: authService.getUser().toOldUser().isarId,
      fileCreatedAt: local.createDateTime,
      fileModifiedAt: local.modifiedDateTime,
      updatedAt: local.modifiedDateTime,
      durationInSeconds: local.duration,
      type: AssetType.values[local.typeInt],
      fileName: local.title!,
      width: local.width,
      height: local.height,
      isFavorite: local.isFavorite,
    );
    if (asset.fileCreatedAt.year == 1970) {
      asset.fileCreatedAt = asset.fileModifiedAt;
    }
    if (local.latitude != null) {
      asset.exifInfo = ExifInfo(lat: local.latitude, long: local.longitude);
    }
    asset.local = local;
    return asset;
  }

  @override
  Future<String?> getOriginalFilename(String id) async {
    final entity = await AssetEntity.fromId(id);

    if (entity == null) {
      return null;
    }

    // titleAsync gets the correct original filename for some assets on iOS
    // otherwise using the `entity.title` would return a random GUID
    return await entity.titleAsync;
  }
}
