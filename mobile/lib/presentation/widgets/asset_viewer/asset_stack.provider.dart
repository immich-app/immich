import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

class ViewerStackState {
  final List<RemoteAsset> assets;
  final int stackIndex;

  bool get hasStack => assets.isNotEmpty;

  RemoteAsset get currentAsset => assets[stackIndex];

  const ViewerStackState({required this.assets, required this.stackIndex});

  ViewerStackState copyWith({
    List<RemoteAsset>? assets,
    int? stackIndex,
  }) {
    return ViewerStackState(
      assets: assets ?? this.assets,
      stackIndex: stackIndex ?? this.stackIndex,
    );
  }
}

class StackChildrenNotifier extends AutoDisposeAsyncNotifier<ViewerStackState> {
  @override
  Future<ViewerStackState> build() async {
    return const ViewerStackState(assets: [], stackIndex: 0);
  }

  Future<void> changeAsset(BaseAsset? asset) async {
    if (asset == null ||
        asset is! RemoteAsset ||
        asset.stackId == null ||
        // The stackCount check is to ensure we only fetch stacks for timelines that have stacks
        asset.stackCount == 0) {
      state = const AsyncData(ViewerStackState(assets: [], stackIndex: 0));
      return;
    }

    final stack = await ref.watch(assetServiceProvider).getStack(asset);
    state = AsyncData(ViewerStackState(assets: stack, stackIndex: 0));
  }

  void setIndex(int index) {
    state = state.maybeMap(
      data: (data) {
        final assets = data.valueOrNull?.assets ?? [];
        return AsyncData(
          ViewerStackState(
            assets: assets,
            stackIndex: index.clamp(0, assets.length - 1),
          ),
        );
      },
      orElse: () => state,
    );
  }
}

final assetWithStackNotifier =
    AsyncNotifierProvider.autoDispose<StackChildrenNotifier, ViewerStackState>(
  StackChildrenNotifier.new,
);
