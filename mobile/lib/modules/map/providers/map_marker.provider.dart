import 'package:immich_mobile/models/map/map_marker.model.dart';
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
  bool? isWithPartners;

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

  if (mapState.withPartners) {
    isWithPartners = true;
  }

  final markers = await service.getMapMarkers(
    isFavorite: isFavorite,
    withArchived: isIncludeArchived,
    withPartners: isWithPartners,
    fileCreatedAfter: fileCreatedAfter,
  );

  return markers.toList();
}
