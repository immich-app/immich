import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/services/asset_stack.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class AssetStackNotifier extends StateNotifier<Set<Asset>> {
  final Asset _asset;
  final Ref _ref;

  AssetStackNotifier(
    this._asset,
    this._ref,
  ) : super({}) {
    fetchStackChildren();
  }

  void fetchStackChildren() async {
    state = await _ref.read(assetStackProvider(_asset).future);
  }

  updateStack(
    List<Asset>? childrenToAdd,
    List<Asset>? childrenToRemove,
  ) async {
    // Guard [local asset]
    if (_asset.remoteId == null) {
      return;
    }

    List<String> toAdd = [];
    if (childrenToAdd != null) {
      toAdd = childrenToAdd
          .where((e) => e.isRemote)
          .map((e) => e.remoteId!)
          .toList();
    }

    List<String> toRemove = [];
    if (childrenToRemove != null) {
      toRemove = childrenToRemove
          .where((e) => e.isRemote)
          .map((e) => e.remoteId!)
          .toList();
    }

    await _ref.read(assetStackServiceProvider).updateStack(
          _asset,
          childrenToAdd: toAdd,
          childrenToRemove: toRemove,
        );

    // sync assets
    await _ref.read(assetProvider.notifier).getAllAsset();
  }
}

final assetStackStateProvider = StateNotifierProvider.autoDispose
    .family<AssetStackNotifier, Set<Asset>, Asset>(
  (ref, asset) => AssetStackNotifier(asset, ref),
);

final assetStackProvider =
    FutureProvider.autoDispose.family<Set<Asset>, Asset>((ref, asset) async {
  // Guard [local asset]
  if (asset.remoteId == null) {
    return {};
  }

  final stack = await ref
      .watch(dbProvider)
      .assets
      .filter()
      .isArchivedEqualTo(false)
      .stackParentIdEqualTo(asset.remoteId)
      .findAll();
  return stack.toSet();
});
