import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ActionItem {
  final IconData icon;
  final String label;
  final Future<void> Function() onAction;
  final Future<void> Function()? onSecondaryAction;

  const ActionItem({required this.icon, required this.label, required this.onAction, this.onSecondaryAction});
}

abstract class ActionBuilder {
  const ActionBuilder();

  ActionItem? build(BuildContext context, WidgetRef ref);
}

typedef AssetsActionState = ({AssetFilter<BaseAsset> assets, AssetFilter<RemoteAsset> ownedAssets});

class AssetsActionNotifier extends AutoDisposeFamilyNotifier<AssetsActionState, ActionSource> {
  @override
  AssetsActionState build(ActionSource source) {
    final selected = switch (source) {
      .timeline => ref.watch(multiSelectProvider.select((s) => s.selectedAssets)),
      .viewer => switch (ref.watch(assetViewerProvider.select((s) => s.currentAsset))) {
        BaseAsset asset => {asset},
        null => const <BaseAsset>{},
      },
    };

    final assets = AssetFilter(selected);
    return (assets: assets, ownedAssets: assets.owned(ref.watch(authUserProvider).id));
  }

  void clearSelect() {
    if (arg == .timeline) {
      ref.read(multiSelectProvider.notifier).reset();
    }
  }
}

final assetsActionProvider = NotifierProvider.family.autoDispose<AssetsActionNotifier, AssetsActionState, ActionSource>(
  AssetsActionNotifier.new,
);

abstract class AssetActionBuilder extends ActionBuilder {
  final ActionSource source;

  const AssetActionBuilder({required this.source});
}
