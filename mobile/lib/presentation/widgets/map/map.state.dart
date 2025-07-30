import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/map.provider.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapState {
  final LatLngBounds bounds;

  const MapState({required this.bounds});

  @override
  bool operator ==(covariant MapState other) {
    return bounds == other.bounds;
  }

  @override
  int get hashCode => bounds.hashCode;

  MapState copyWith({LatLngBounds? bounds}) {
    return MapState(bounds: bounds ?? this.bounds);
  }
}

class MapStateNotifier extends Notifier<MapState> {
  MapStateNotifier();

  bool setBounds(LatLngBounds bounds) {
    if (state.bounds == bounds) {
      return false;
    }
    state = state.copyWith(bounds: bounds);
    return true;
  }

  @override
  MapState build() => MapState(
    // TODO: set default bounds
    bounds: LatLngBounds(northeast: const LatLng(0, 0), southwest: const LatLng(0, 0)),
  );
}

// This provider watches the markers from the map service and serves the markers.
// It should be used only after the map service provider is overridden
final mapMarkerProvider = FutureProvider.family<Map<String, dynamic>, LatLngBounds?>((ref, bounds) async {
  final mapService = ref.watch(mapServiceProvider);
  final markers = await mapService.getMarkers(bounds);
  final features = List.filled(markers.length, const <String, dynamic>{});
  for (int i = 0; i < markers.length; i++) {
    final marker = markers[i];
    features[i] = {
      'type': 'Feature',
      'id': marker.assetId,
      'geometry': {
        'type': 'Point',
        'coordinates': [marker.location.longitude, marker.location.latitude],
      },
    };
  }
  return {'type': 'FeatureCollection', 'features': features};
}, dependencies: [mapServiceProvider]);

final mapStateProvider = NotifierProvider<MapStateNotifier, MapState>(MapStateNotifier.new);
