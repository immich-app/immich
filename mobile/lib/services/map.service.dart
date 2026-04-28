import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/models/map/map_marker.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/user_agent.dart';
import 'package:logging/logging.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapService with ErrorLoggerMixin {
  final ApiService _apiService;
  @override
  final logger = Logger("MapService");

  MapService(this._apiService) {
    _setMapUserAgentHeader();
  }

  Future<void> _setMapUserAgentHeader() async {
    final userAgent = await getUserAgentString();
    await setHttpHeaders({'User-Agent': userAgent});
  }

  Future<Iterable<MapMarker>> getMapMarkers({
    bool? isFavorite,
    bool? withArchived,
    bool? withPartners,
    // Shared-albums fork: when true (default on), markers from assets in albums
    // shared with the user are included alongside their own.
    bool? withSharedAlbums = true,
    DateTime? fileCreatedAfter,
    DateTime? fileCreatedBefore,
  }) async {
    return logError(
      () async {
        final markers = await _apiService.mapApi.getMapMarkers(
          isFavorite: isFavorite,
          isArchived: withArchived,
          withPartners: withPartners,
          withSharedAlbums: withSharedAlbums,
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
