import 'dart:async';

import 'package:flutter/material.dart';
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
  final FutureOr<void> Function() onAction;
  final FutureOr<void> Function()? onSecondaryAction;

  const ActionItem({required this.icon, required this.label, required this.onAction, this.onSecondaryAction});
}

abstract class ActionBuilder {
  const ActionBuilder();

  // null when the action is not applicable for the current context
  ActionItem? create(BuildContext context, WidgetRef ref);
}

final assetsActionProvider = Provider.family.autoDispose<AssetFilter<BaseAsset>, ActionSource>(
  (ref, source) => AssetFilter(switch (source) {
    .timeline => ref.watch(multiSelectProvider.select((s) => s.selectedAssets)),
    .viewer => switch (ref.watch(assetViewerProvider.select((s) => s.currentAsset))) {
      final BaseAsset asset => {asset},
      null => const <BaseAsset>{},
    },
  }),
  dependencies: [multiSelectProvider],
);

final clearSelectionProvider = Provider.family.autoDispose<VoidCallback, ActionSource>((ref, source) {
  if (source == .timeline) {
    return ref.read(multiSelectProvider.notifier).reset;
  }

  return () {};
}, dependencies: [multiSelectProvider]);

final ownedAssetsActionProvider = Provider.family.autoDispose<AssetFilter<RemoteAsset>, ActionSource>(
  (ref, source) => ref.watch(assetsActionProvider(source)).owned(ref.watch(authUserProvider).id),
  dependencies: [assetsActionProvider],
);

abstract class AssetActionBuilder extends ActionBuilder {
  final ActionSource source;

  const AssetActionBuilder({required this.source});
}
