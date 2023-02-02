import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

final favoriteProvider = StateProvider((ref) {
  return ref.watch(assetProvider).allAssets
      .where((element) => element.isRemote)
      .map((e) => e.remote!)
      .where((element) => element.isFavorite)
      .map(Asset.remote)
      .toList();
});
