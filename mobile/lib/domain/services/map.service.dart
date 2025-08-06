import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/infrastructure/repositories/map.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

typedef MapMarkerSource = Future<List<Marker>> Function(LatLngBounds? bounds);

typedef MapQuery = ({MapMarkerSource markerSource});

class MapFactory {
  final DriftMapRepository _mapRepository;

  const MapFactory({required DriftMapRepository mapRepository}) : _mapRepository = mapRepository;

  MapService remote(String ownerId) => MapService(_mapRepository.remote(ownerId));
}

class MapService {
  final MapMarkerSource _markerSource;

  MapService(MapQuery query) : _markerSource = query.markerSource;

  Future<List<Marker>> Function(LatLngBounds? bounds) get getMarkers => _markerSource;
}
