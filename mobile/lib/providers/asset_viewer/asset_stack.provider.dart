import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'asset_stack.provider.g.dart';

class AssetStackNotifier extends StateNotifier<List<Asset>> {
  final AssetService assetService;
  final String _stackId;

  AssetStackNotifier(this.assetService, this._stackId) : super([]) {
    _fetchStack(_stackId);
  }

  void _fetchStack(String stackId) async {
    if (!mounted) {
      return;
    }

    final stack = await assetService.getStackAssets(stackId);
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
  (ref, stackId) =>
      AssetStackNotifier(ref.watch(assetServiceProvider), stackId),
);

@riverpod
int assetStackIndex(Ref ref, Asset asset) {
  return -1;
}
