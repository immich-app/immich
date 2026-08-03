import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

typedef _State = ({bool shouldStack, List<String> assetIds, List<String> stackIds});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final assets = ref.watch(ownedAssetsActionProvider(source));
  final shouldStack = assets.stacked(isStacked: false).isNotEmpty;
  // Stacking needs at least two assets; unstacking needs at least one stack.
  if (shouldStack ? assets.elementAtOrNull(1) == null : assets.isEmpty) {
    return null;
  }

  return (
    shouldStack: shouldStack,
    assetIds: assets.map((asset) => asset.id).toList(growable: false),
    stackIds: assets.map((asset) => asset.stackId).nonNulls.toList(growable: false),
  );
});

class StackAction extends AssetActionBuilder {
  const StackAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final shouldStack = ref.watch(_stateProvider(source).select((state) => state?.shouldStack));
    if (shouldStack == null) {
      return null;
    }

    return .new(
      icon: shouldStack ? Icons.filter_none_rounded : Icons.layers_clear_outlined,
      label: shouldStack ? context.t.stack : context.t.unstack,
      onAction: () => _stack(context, ref),
    );
  }

  Future<void> _stack(BuildContext context, WidgetRef ref) async {
    final state = ref.read(_stateProvider(source));
    if (state == null) {
      return;
    }

    final (:shouldStack, :assetIds, :stackIds) = state;
    final message = shouldStack
        ? context.t.stacked_assets_count(count: assetIds.length)
        : context.t.unstacked_assets_count(count: assetIds.length);
    final assetService = ref.read(assetServiceProvider);
    final userId = ref.read(authUserProvider).id;
    final toastService = ref.read(toastServiceProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      if (shouldStack) {
        await assetService.stack(userId, assetIds);
      } else {
        await assetService.unstack(stackIds);
      }
      toastService.success(message);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the stack for assets");
    }
  }
}
