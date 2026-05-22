import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/asset.service.dart';

final allMotionPhotosProvider = FutureProvider<List<Asset>>((ref) async {
  return ref.watch(assetServiceProvider).getMotionAssets();
});
