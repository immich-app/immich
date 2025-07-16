import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/infrastructure/repositories/map.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

typedef MapMarkerSource = Stream<List<Marker>> Function(LatLngBounds? bounds);

typedef MapQuery = ({
  MapMarkerSource markerSource,
});

class MapFactory {
  final DriftMapRepository _mapRepository;

  const MapFactory({
    required DriftMapRepository mapRepository,
  }) : _mapRepository = mapRepository;

  MapService remote(String ownerId) =>
      MapService(_mapRepository.remote(ownerId));

  MapService favorite(String ownerId) =>
      MapService(_mapRepository.favorite(ownerId));

  MapService locked(String ownerId) =>
      MapService(_mapRepository.locked(ownerId));
}

class MapService {
  final MapMarkerSource _markerSource;

  MapService(MapQuery query)
      : this._(
          markerSource: query.markerSource,
        );

  MapService._({
    required MapMarkerSource markerSource,
  }) : _markerSource = markerSource;

  Stream<List<Marker>> Function(LatLngBounds? bounds) get watchMarkers =>
      _markerSource;

  Future<void> dispose() async {}
}
