import 'package:immich_mobile/modules/map/models/map_marker.dart';
import 'package:immich_mobile/modules/map/providers/map_service.provider.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'map_marker.provider.g.dart';

@riverpod
Future<List<MapMarker>> mapMarkers(MapMarkersRef ref) async {
  final service = ref.read(mapServiceProvider);
  final mapState = ref.read(mapStateNotifierProvider);
  DateTime? fileCreatedAfter;
  bool? isFavorite;
  bool? isIncludeArchived;

  if (mapState.relativeTime != 0) {
    fileCreatedAfter =
        DateTime.now().subtract(Duration(days: mapState.relativeTime));
  }

  if (mapState.showFavoriteOnly) {
    isFavorite = true;
  }

  if (!mapState.includeArchived) {
    isIncludeArchived = false;
  }

  final markers = await service.getMapMarkers(
    isFavorite: isFavorite,
    withArchived: isIncludeArchived,
    fileCreatedAfter: fileCreatedAfter,
  );

  return markers.toList();
}
