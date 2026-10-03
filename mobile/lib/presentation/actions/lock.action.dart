import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/services/toast.service.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:logging/logging.dart';

typedef _State = ({bool shouldLock, List<String> assetIds, List<String> localIds});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final assets = ref.watch(ownedAssetsActionProvider(source));
  if (assets.isEmpty) {
    return null;
  }

  final shouldLock = assets.locked(isLocked: false).isNotEmpty;
  final targets = assets.locked(isLocked: !shouldLock);
  return (
    shouldLock: shouldLock,
    assetIds: targets.map((asset) => asset.id).toList(growable: false),
    // Only locking has an on-device copy to clean up; unlocking leaves the device alone.
    localIds: shouldLock ? targets.map((asset) => asset.localId).nonNulls.toList(growable: false) : const [],
  );
}, dependencies: [ownedAssetsActionProvider]);

class LockAction extends AssetActionBuilder {
  const LockAction({required super.source});

  static final Logger _log = Logger('LockAction');

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
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
    if (shouldLock && localIds.isNotEmpty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (_) => ConfirmDialog(
          title: context.t.move_to_locked_folder,
          content: CurrentPlatform.isAndroid
              ? context.t.delete_dialog_alert_local
              : context.t.delete_dialog_alert_local_ios,
          ok: context.t.confirm,
        ),
      );
      if (confirmed != true || !context.mounted) {
        return;
      }
    }

    final assetService = ref.read(assetServiceProvider);
    final toastService = ref.read(toastServiceProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      await assetService.update(assetIds, visibility: .some(shouldLock ? .locked : .timeline));
      var keptCount = 0;
      if (localIds.isNotEmpty) {
        // A locked asset still sits in the device gallery, so offer to remove the local copy.
        keptCount = localIds.length - await assetService.deleteLocal(localIds, trash: false);
        if (keptCount != 0) {
          _log.warning('Only deleted ${localIds.length - keptCount} of ${localIds.length} local copies');
        }
      }
      if (!context.mounted) {
        return;
      }
      final message = shouldLock
          ? keptCount > 0
                ? context.t.move_to_lock_folder_partial_prompt(count: assetIds.length)
                : context.t.move_to_lock_folder_action_prompt(count: assetIds.length)
          : context.t.remove_from_lock_folder_action_prompt(count: assetIds.length);
      // Unlocking is a sensitive action and requires an elevated session
      final toast = shouldLock
          ? null
          : ToastOption(onUndo: () => assetService.update(assetIds, visibility: const .some(.locked)));
      toastService.success(message, toast: toast);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the locked folder for assets");
    }
  }
}
