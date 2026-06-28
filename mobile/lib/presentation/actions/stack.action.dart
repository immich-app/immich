import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class StackAction extends AssetAction<RemoteAsset> {
  final bool shouldStack;

  StackAction({required super.assets})
    : shouldStack = assets.any((asset) => asset is RemoteAsset && asset.stackId == null);

  @override
  IconData get icon => shouldStack ? Icons.filter_none_rounded : Icons.layers_clear_outlined;

  @override
  String label(ActionScope scope) => shouldStack ? scope.context.t.stack : scope.context.t.unstack;

  @override
  Iterable<RemoteAsset> filter(ActionScope scope) =>
      assets.whereType<RemoteAsset>().where((asset) => asset.ownerId == scope.authUser.id);

  @override
  bool isVisible(ActionScope scope) => shouldStack ? filter(scope).length > 1 : filter(scope).isNotEmpty;

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:ref) = scope;
    final assets = filter(scope).toList(growable: false);
    final service = ref.read(assetServiceProvider);

    if (shouldStack) {
      await service.stack(scope.authUser.id, assets.map((asset) => asset.id).toList(growable: false));
    } else {
      await service.unStack(assets.map((asset) => asset.stackId).nonNulls.toList(growable: false));
    }

    final message = shouldStack
        ? StaticTranslations.instance.stacked_assets_count(count: assets.length)
        : StaticTranslations.instance.unstacked_assets_count(count: assets.length);
    snackbar.success(message);
  }
}
