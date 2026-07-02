import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class StackAction extends AssetAction<RemoteAsset> {
  const StackAction({required super.assets});

  @override
  AssetActionView<RemoteAsset> resolve(ActionScope scope) {
    final unstacked = AssetFilter(assets).owned(scope.authUser.id).any((asset) => asset.stackId == null);
    return unstacked ? StackView(assets: assets, scope: scope) : UnstackView(assets: assets, scope: scope);
  }
}

@visibleForTesting
class StackView extends AssetActionView<RemoteAsset> {
  const StackView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.filter_none_rounded;

  @override
  String get label => scope.context.t.stack;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id);

  @override
  bool get isVisible => filter.length > 1;

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter.map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).stack(scope.authUser.id, ids);
    ref.read(toastRepositoryProvider).success(context.t.stacked_assets_count(count: ids.length));
  }
}

@visibleForTesting
class UnstackView extends AssetActionView<RemoteAsset> {
  const UnstackView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.layers_clear_outlined;

  @override
  String get label => scope.context.t.unstack;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id);

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final assets = filter.toList(growable: false);
    final stackIds = assets.map((asset) => asset.stackId).nonNulls.toList(growable: false);
    await ref.read(assetServiceProvider).unstack(stackIds);
    ref.read(toastRepositoryProvider).success(context.t.unstacked_assets_count(count: assets.length));
  }
}
