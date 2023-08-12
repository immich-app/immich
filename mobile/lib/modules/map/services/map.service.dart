import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_marker.provider.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

final mapServiceProvider = Provider(
  (ref) => MapSerivce(
    ref.watch(apiServiceProvider),
  ),
);

class MapSerivce {
  final ApiService _apiService;
  final log = Logger("MapService");

  MapSerivce(this._apiService);

  Future<List<AssetMapMarker>?> getMapMarkers(bool? isFavorite) async {
    try {
      final markers =
          await _apiService.assetApi.getMapMarkers(isFavorite: isFavorite);
      if (markers == null) {
        return null;
      }

      return markers
          .map(
            (m) => AssetMapMarker(
              point: LatLng(latitude: m.lat, longitude: m.lon),
              assetId: m.id,
            ),
          )
          .toList();
    } catch (error, stack) {
      log.severe("Cannot get map markers ${error.toString()}", error, stack);
      return null;
    }
  }
}
