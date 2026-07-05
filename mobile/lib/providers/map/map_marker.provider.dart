import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/map/map_marker.model.dart';
import 'package:immich_mobile/providers/map/map_service.provider.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';

final mapMarkersProvider = FutureProvider.autoDispose<List<MapMarker>>((ref) async {
  final service = ref.read(mapServiceProvider);
  final mapState = ref.read(mapStateNotifierProvider);
  DateTime? fileCreatedAfter;
  bool? isFavorite;
  bool isIncludeArchived = mapState.includeArchived;
  bool isWithPartners = mapState.withPartners;

  if (mapState.relativeTime != 0) {
    fileCreatedAfter = DateTime.now().subtract(Duration(days: mapState.relativeTime));
  }

  if (mapState.showFavoriteOnly) {
    isFavorite = true;
  }

  final markers = await service.getMapMarkers(
    isFavorite: isFavorite,
    withArchived: isIncludeArchived,
    withPartners: isWithPartners,
    fileCreatedAfter: fileCreatedAfter,
  );

  return markers.toList();
});
