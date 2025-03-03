import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/asset.service.dart';

final recentlyAddedAssetProvider = FutureProvider<List<Asset>>((ref) async {
  final assetService = ref.read(assetServiceProvider);

  return assetService.getRecentlyAddedAssets();
});
