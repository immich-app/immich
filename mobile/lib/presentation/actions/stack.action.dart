import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class StackAction extends BaseAction {
  final List<String> assetIds;
  final List<String> stackIds;
  final bool stack;

  const StackAction._({
    required this.assetIds,
    required this.stackIds,
    required this.stack,
    required super.scope,
    required super.icon,
    required super.label,
    super.isVisible,
  });

  factory StackAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final ownedAssets = AssetFilter(assets).owned(scope.authUser.id);
    // Stack when any owned asset is not yet stacked; otherwise unstack them all.
    final stack = ownedAssets.stacked(isStacked: false).isNotEmpty;
    final assetIds = ownedAssets.map((asset) => asset.id).toList(growable: false);
    final stackIds = ownedAssets.map((asset) => asset.stackId).nonNulls.toList(growable: false);

    return StackAction._(
      assetIds: assetIds,
      stackIds: stackIds,
      stack: stack,
      scope: scope,
      icon: stack ? Icons.filter_none_rounded : Icons.layers_clear_outlined,
      label: stack ? scope.context.t.stack : scope.context.t.unstack,
      isVisible: stack ? assetIds.length > 1 : stackIds.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    if (stack) {
      await ref.read(assetServiceProvider).stack(scope.authUser.id, assetIds);
    } else {
      await ref.read(assetServiceProvider).unstack(stackIds);
    }

    final message = stack
        ? context.t.stacked_assets_count(count: assetIds.length)
        : context.t.unstacked_assets_count(count: assetIds.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
