import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

typedef AssetActionSelection = ({Set<BaseAsset> assets, void Function() clearSelect});

final assetsActionProvider = Provider.family<AssetActionSelection, ActionSource>((ref, source) {
  final assets = switch (source) {
    ActionSource.timeline => ref.watch(multiSelectProvider.select((s) => s.selectedAssets)),
    ActionSource.viewer => switch (ref.watch(assetViewerProvider.select((s) => s.currentAsset))) {
      BaseAsset asset => {asset},
      null => const <BaseAsset>{},
    },
  };

  return (
    assets: assets,
    clearSelect: () {
      if (source == ActionSource.timeline) {
        ref.read(multiSelectProvider.notifier).reset();
      }
    },
  );
});

abstract class AssetAction extends ActionWidget {
  final ActionSource source;

  const AssetAction({super.key, super.display, this.source = ActionSource.timeline});
}
