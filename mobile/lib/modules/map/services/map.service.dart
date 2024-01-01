import 'package:immich_mobile/modules/map/models/map_marker.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';

class MapSerivce {
  final ApiService _apiService;
  final _log = Logger("MapService");

  MapSerivce(this._apiService);

  Future<Iterable<MapMarker>> getMapMarkers({
    bool? isFavorite,
    bool? withArchived,
    DateTime? fileCreatedAfter,
    DateTime? fileCreatedBefore,
  }) async {
    try {
      final markers = await _apiService.assetApi.getMapMarkers(
        isFavorite: isFavorite,
        isArchived: withArchived,
        fileCreatedAfter: fileCreatedAfter,
        fileCreatedBefore: fileCreatedBefore,
      );

      return markers?.map(MapMarker.fromDto).nonNulls ?? [];
    } catch (error, stack) {
      _log.severe("Cannot get map markers ${error.toString()}", error, stack);
      return [];
    }
  }
}
