import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_settings.provider.dart';
import 'package:immich_mobile/modules/map/services/map.service.dart';
import 'package:photo_manager/photo_manager.dart';

final mapMarkerFutureProvider =
    FutureProvider.autoDispose<List<AssetMapMarker>?>((ref) async {
  final service = ref.watch(mapServiceProvider);
  final isFavorite = ref.watch(mapSettingsStateNotifier).showFavoriteOnly;

  return await service.getMapMarkers(isFavorite);
});

class AssetMapMarker {
  final LatLng point;
  final String assetId;

  AssetMapMarker({required this.point, required this.assetId});
}
