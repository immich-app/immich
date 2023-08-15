import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/services/map.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:openapi/api.dart';

final mapMarkerFutureProvider =
    FutureProvider.autoDispose<List<MapMarkerResponseDto>?>((ref) async {
  final service = ref.read(mapServiceProvider);
  final mapState = ref.read(mapStateNotifier);
  DateTime? fileCreatedAfter;

  int? relativeTime = mapState.relativeTime;
  if (relativeTime != null && relativeTime != 0) {
    fileCreatedAfter =
        DateTime.now().subtract(Duration(days: mapState.relativeTime!));
  }

  return await service.getMapMarkers(
    isFavorite: mapState.showFavoriteOnly,
    fileCreatedAfter: fileCreatedAfter,
  );
});

final mapMarkerAssetProvider =
    FutureProvider.family.autoDispose<Asset?, String>((ref, remoteId) async {
  final service = ref.watch(mapServiceProvider);
  return await service.getAssetForMarker(remoteId);
});

final mapMarkerExifInfoProvider =
    FutureProvider.family.autoDispose<ExifInfo?, String>((ref, remoteId) async {
  final service = ref.watch(mapServiceProvider);
  return await service.getExifInfoForMarker(remoteId);
});
