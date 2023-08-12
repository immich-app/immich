import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/services/map.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';

final mapMarkerFutureProvider =
    FutureProvider.autoDispose<List<AssetMapMarker>?>((ref) async {
  final service = ref.watch(mapServiceProvider);
  final isFavorite = ref.watch(mapStateNotifier).showFavoriteOnly;

  return await service.getMapMarkers(isFavorite);
});

final mapMarkerAssetProvider =
    FutureProvider.family.autoDispose<Asset?, String>((ref, remoteId) async {
  final service = ref.watch(mapServiceProvider);
  return await service.getAssetForMarker(remoteId);
});

final mapMarkerExifInfoProvider =
    FutureProvider.family.autoDispose<ExifInfo?, String>((ref, remoteId) async {
  final service = ref.watch(mapServiceProvider);
  return await service.getExifInfoForMarker(remoteId);
});

class AssetMapMarker {
  final double latitude;
  final double longitude;
  final String assetId;

  AssetMapMarker({
    required this.latitude,
    required this.longitude,
    required this.assetId,
  });
}
