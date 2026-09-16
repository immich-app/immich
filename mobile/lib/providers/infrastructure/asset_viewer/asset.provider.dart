import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';

final assetExifProvider = FutureProvider.autoDispose.family<ExifInfo?, BaseAsset>((ref, asset) {
  return ref.watch(assetServiceProvider).getExif(asset);
});

final assetOriginalPathProvider = FutureProvider.autoDispose.family<String?, BaseAsset>((ref, asset) async {
  final assetId = asset.remoteId;
  if (assetId == null) {
    return null;
  }

  return ref.watch(assetApiRepositoryProvider).getOriginalPath(assetId);
});
