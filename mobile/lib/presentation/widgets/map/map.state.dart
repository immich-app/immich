import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/map/marker_build.dart';
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

  void setBounds(LatLngBounds bounds) {
    state = state.copyWith(bounds: bounds);
  }

  @override
  MapState build() => MapState(
    // TODO: set default bounds
    bounds: LatLngBounds(
      northeast: const LatLng(0, 0),
      southwest: const LatLng(0, 0),
    ),
  );
}

// This provider watches the markers from the map service and serves the markers.
// It should be used only after the map service provider is overridden
final mapMarkerProvider = StreamProvider.family<Map<String, dynamic>, LatLngBounds>(
  (ref, bounds) async* {
    final mapService = ref.watch(mapServiceProvider);
    yield* mapService.watchMarkers(bounds).map((markers) {
      return MarkerBuilder(
        markers: markers,
      ).generate();
    });
  },
  dependencies: [mapServiceProvider],
);

final mapAssetsProvider = StreamProvider.family<List<String>, LatLngBounds>(
  (ref, bounds) async* {
    final mapService = ref.watch(mapServiceProvider);
    yield* mapService.watchMarkers(bounds).map((markers) {
      return markers.map((marker) => marker.assetId).toList();
    });
  },
  dependencies: [mapServiceProvider],
);

final mapStateProvider =
    NotifierProvider<MapStateNotifier, MapState>(
  MapStateNotifier.new,
);
