import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'asset_stack.provider.g.dart';

class AssetStackNotifier extends StateNotifier<List<Asset>> {
  final String _stackId;
  final Ref _ref;

  AssetStackNotifier(this._stackId, this._ref) : super([]) {
    _fetchStack(_stackId);
  }

  void _fetchStack(String stackId) async {
    if (!mounted) {
      return;
    }

    final stack = await _ref.read(assetStackProvider(stackId).future);
    if (stack.isNotEmpty) {
      state = stack;
    }
  }

  void removeChild(int index) {
    if (index < state.length) {
      state.removeAt(index);
      state = List<Asset>.from(state);
    }
  }
}

final assetStackStateProvider = StateNotifierProvider.autoDispose
    .family<AssetStackNotifier, List<Asset>, String>(
  (ref, stackId) => AssetStackNotifier(stackId, ref),
);

final assetStackProvider =
    FutureProvider.autoDispose.family<List<Asset>, String>((ref, stackId) {
  return ref
      .watch(dbProvider)
      .assets
      .filter()
      .isArchivedEqualTo(false)
      .isTrashedEqualTo(false)
      .stackIdEqualTo(stackId)
      // orders primary asset first as its ID is null
      .sortByStackPrimaryAssetId()
      .thenByFileCreatedAtDesc()
      .findAll();
});

@riverpod
int assetStackIndex(AssetStackIndexRef ref, Asset asset) {
  return -1;
}
