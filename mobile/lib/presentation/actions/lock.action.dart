import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

typedef _State = ({bool shouldLock, List<String> assetIds, List<String> localIds});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final AssetsActionState(:ownedAssets) = ref.watch(assetsActionProvider(source));
  if (ownedAssets.isEmpty) {
    return null;
  }

  final shouldLock = ownedAssets.locked(isLocked: false).isNotEmpty;
  final targets = ownedAssets.locked(isLocked: !shouldLock);
  return (
    shouldLock: shouldLock,
    assetIds: targets.map((asset) => asset.id).toList(growable: false),
    // Only locking has an on-device copy to clean up; unlocking leaves the device alone.
    localIds: shouldLock ? targets.map((asset) => asset.localId).nonNulls.toList(growable: false) : const [],
  );
});

class LockAction extends AssetActionBuilder {
  const LockAction({required super.source});

  @override
  ActionData? build(BuildContext context, WidgetRef ref) {
    final shouldLock = ref.watch(_stateProvider(source).select((state) => state?.shouldLock));
    if (shouldLock == null) {
      return null;
    }

    return .new(
      icon: shouldLock ? Icons.lock_rounded : Icons.lock_open_rounded,
      label: shouldLock ? context.t.move_to_locked_folder : context.t.remove_from_locked_folder,
      onAction: () => _lock(context, ref),
    );
  }

  Future<void> _lock(BuildContext context, WidgetRef ref) async {
    final state = ref.read(_stateProvider(source));
    if (state == null) {
      return;
    }

    final (:shouldLock, :assetIds, :localIds) = state;
    final message = shouldLock
        ? context.t.move_to_lock_folder_action_prompt(count: assetIds.length)
        : context.t.remove_from_lock_folder_action_prompt(count: assetIds.length);
    final service = ref.read(assetServiceProvider);
    final toast = ref.read(toastRepositoryProvider);
    final selection = ref.read(assetsActionProvider(source).notifier);

    try {
      await service.update(assetIds, visibility: .some(shouldLock ? .locked : .timeline));
      if (localIds.isNotEmpty) {
        // A locked asset still sits in the device gallery, so offer to remove the local copy.
        await service.deleteLocal(localIds);
      }
      toast.success(message);
      selection.clearSelect();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the locked folder for assets");
    }
  }
}
