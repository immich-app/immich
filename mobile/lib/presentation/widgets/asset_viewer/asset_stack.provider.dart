import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

class StackChildrenNotifier
    extends AutoDisposeFamilyAsyncNotifier<List<RemoteAsset>, BaseAsset?> {
  @override
  Future<List<RemoteAsset>> build(BaseAsset? asset) async {
    if (asset == null ||
        asset is! RemoteAsset ||
        asset.stackId == null ||
        // The stackCount check is to ensure we only fetch stacks for timelines that have stacks
        asset.stackCount == 0) {
      return const [];
    }

    return ref.watch(assetServiceProvider).getStack(asset);
  }
}

final stackChildrenNotifier = AsyncNotifierProvider.autoDispose
    .family<StackChildrenNotifier, List<RemoteAsset>, BaseAsset?>(
  StackChildrenNotifier.new,
);
