import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';

final assetServiceProvider = Provider((ref) {
  final db = ref.watch(driftProvider);
  return AssetService(
    remoteRepository: db.remoteAssetRepository,
    exifRepository: db.remoteExifRepository,
    localRepository: db.localAssetRepository,
    apiRepository: ref.watch(assetApiRepositoryProvider),
    mediaRepository: ref.watch(assetMediaRepositoryProvider),
    trashedLocalRepository: db.trashedLocalAssetRepository,
  );
});

final placesProvider = FutureProvider<List<(String, String)>>((ref) {
  final assetService = ref.watch(assetServiceProvider);
  final auth = ref.watch(currentUserProvider);

  if (auth == null) {
    return Future.value(const []);
  }

  return assetService.getPlaces(auth.id);
});
