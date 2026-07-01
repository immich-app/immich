import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class StackAction extends AssetAction<RemoteAsset> {
  final bool stack;

  StackAction({required super.assets}) : stack = assets.any((asset) => asset is RemoteAsset && asset.stackId == null);

  @override
  IconData get icon => stack ? Icons.filter_none_rounded : Icons.layers_clear_outlined;

  @override
  String label(ActionScope scope) => stack ? scope.context.t.stack : scope.context.t.unstack;

  @override
  AssetFilter<RemoteAsset> filter(ActionScope scope) => .new(assets).owned(scope.authUser.id);

  @override
  bool isVisible(ActionScope scope) => stack ? filter(scope).length > 1 : filter(scope).isNotEmpty;

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:ref, :context) = scope;
    final assets = filter(scope).toList(growable: false);
    final service = ref.read(assetServiceProvider);

    if (stack) {
      await service.stack(scope.authUser.id, assets.map((asset) => asset.id).toList(growable: false));
    } else {
      await service.unstack(assets.map((asset) => asset.stackId).nonNulls.toList(growable: false));
    }

    final message = stack
        ? context.t.stacked_assets_count(count: assets.length)
        : context.t.unstacked_assets_count(count: assets.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
