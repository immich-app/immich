import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionNotifier extends StateNotifier<List<ImmichAsset>> {
  AssetSelectionNotifier() : super([]);
}

final assetSelectionProvider = StateNotifierProvider<AssetSelectionNotifier, List<ImmichAsset>>((ref) {
  return AssetSelectionNotifier();
});
