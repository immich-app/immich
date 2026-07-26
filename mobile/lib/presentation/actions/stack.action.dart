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
  final AssetsActionState(:ownedAssets) = ref.watch(assetsActionProvider(source));
  final shouldStack = ownedAssets.stacked(isStacked: false).isNotEmpty;
  // Stacking needs at least two assets; unstacking needs at least one stack.
  if (shouldStack ? ownedAssets.elementAtOrNull(1) == null : ownedAssets.isEmpty) {
    return null;
  }

  return (
    shouldStack: shouldStack,
    assetIds: ownedAssets.map((asset) => asset.id).toList(growable: false),
    stackIds: ownedAssets.map((asset) => asset.stackId).nonNulls.toList(growable: false),
  );
});

class StackAction extends AssetActionBuilder {
  const StackAction({required super.source});

  @override
  ActionData? build(BuildContext context, WidgetRef ref) {
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
    final service = ref.read(assetServiceProvider);
    final userId = ref.read(authUserProvider).id;
    final toast = ref.read(toastRepositoryProvider);
    final selection = ref.read(assetsActionProvider(source).notifier);

    try {
      if (shouldStack) {
        await service.stack(userId, assetIds);
      } else {
        await service.unstack(stackIds);
      }
      toast.success(message);
      selection.clearSelect();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the stack for assets");
    }
  }
}
