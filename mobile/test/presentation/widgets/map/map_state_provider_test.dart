import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/domain/services/map.service.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/providers/infrastructure/map.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:mocktail/mocktail.dart';

class _MockMapService extends Mock implements MapService {}

void main() {
  group('mapMarkerProvider', () {
    test('remote content changes refetch marker GeoJSON for the active bounds', () async {
      final service = _MockMapService();
      final bounds = LatLngBounds(southwest: const LatLng(-10, -10), northeast: const LatLng(10, 10));
      var calls = 0;
      when(() => service.getMarkers).thenReturn((_) async {
        calls++;
        return [Marker(assetId: 'asset-$calls', location: const LatLng(1, 2))];
      });

      final container = ProviderContainer(overrides: [mapServiceProvider.overrideWithValue(service)]);
      addTearDown(container.dispose);

      final first = await container.read(mapMarkerProvider(bounds).future);
      expect(first['features'], [
        {
          'type': 'Feature',
          'id': 'asset-1',
          'geometry': {
            'type': 'Point',
            'coordinates': [2.0, 1.0],
          },
        },
      ]);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();
      final second = await container.read(mapMarkerProvider(bounds).future);

      expect(calls, 2);
      expect((second['features'] as List).single['id'], 'asset-2');
    });
  });
}
