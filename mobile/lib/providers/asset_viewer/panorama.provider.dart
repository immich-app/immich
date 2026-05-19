import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';

final isPanoramaProvider = FutureProvider.autoDispose.family<bool, BaseAsset>((ref, asset) async {
  if (!asset.isImage || !asset.hasRemote) {
    return false;
  }

  final exif = await ref.watch(assetExifProvider(asset).future);
  return exif?.isPanorama ?? false;
});
