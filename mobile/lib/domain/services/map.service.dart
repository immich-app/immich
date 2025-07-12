import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/infrastructure/repositories/map.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

typedef MapMarkerSource = Stream<List<Marker>> Function(LatLngBounds bounds);

class MapFactory {
  final DriftMapRepository _mapRepository;

  const MapFactory({
    required DriftMapRepository mapRepository,
  })  : _mapRepository = mapRepository;

  MapService main(List<String> timelineUsers) => MapService(
        markerSource: (bounds) => _mapRepository.watchMainMarker(timelineUsers, bounds: bounds),
      );

  MapService remoteAlbum({required String albumId}) => MapService(
        markerSource: (bounds) => _mapRepository.watchRemoteAlbumMarker(albumId, bounds: bounds),
      );
}

class MapService {
  final MapMarkerSource _markerSource;

  MapService({
    required MapMarkerSource markerSource,
  })  : _markerSource = markerSource;

  Stream<List<Marker>> Function(LatLngBounds bounds) get watchMarkers => _markerSource;

  Future<void> dispose() async {}
}
