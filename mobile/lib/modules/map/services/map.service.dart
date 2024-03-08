import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/modules/map/models/map_marker.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';

class MapSerivce with ErrorLoggerMixin {
  final ApiService _apiService;
  @override
  final logger = Logger("MapService");

  MapSerivce(this._apiService);

  Future<Iterable<MapMarker>> getMapMarkers({
    bool? isFavorite,
    bool? withArchived,
    DateTime? fileCreatedAfter,
    DateTime? fileCreatedBefore,
  }) async {
    return logError(
      () async {
        final markers = await _apiService.assetApi.getMapMarkers(
          isFavorite: isFavorite,
          isArchived: withArchived,
          fileCreatedAfter: fileCreatedAfter,
          fileCreatedBefore: fileCreatedBefore,
        );

        return markers?.map(MapMarker.fromDto) ?? [];
      },
      defaultValue: [],
      errorMessage: "Failed to get map markers",
    );
  }
}
