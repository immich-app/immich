import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/services/cleanup.service.dart';
import 'package:immich_mobile/services/toast.service.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

typedef _State = ({List<String> localIds, List<String> remoteIds, bool trash, bool isLocalOnly});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final assets = ref.watch(assetsActionProvider(source));
  final authUserId = ref.watch(authUserProvider).id;

  final localIds = <String>[];
  final ownedRemote = <RemoteAsset>[];
  for (final asset in assets) {
    if (asset.localId case final localId?) {
      localIds.add(localId);
    }
    if (asset case final RemoteAsset remote when remote.ownerId == authUserId) {
      ownedRemote.add(remote);
    }
  }

  if (localIds.isEmpty && ownedRemote.isEmpty) {
    return null;
  }

  final trashEnabled = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
  // Assets already in the trash or in the locked folder are deleted outright, irrespective of the server setting.
  final trash =
      ownedRemote.isEmpty || (trashEnabled && !ownedRemote.every((asset) => asset.isTrashed || asset.isLocked));
  final remoteIds = ownedRemote.map((asset) => asset.id).toList(growable: false);
  final isLocalOnly = assets.any((asset) => asset.isLocalOnly);

  return (localIds: localIds, remoteIds: remoteIds, trash: trash, isLocalOnly: isLocalOnly);
}, dependencies: [assetsActionProvider]);

class DeleteAction extends AssetActionBuilder {
  const DeleteAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final trash = ref.watch(_stateProvider(source).select((state) => state?.trash));
    if (trash == null) {
      return null;
    }

    return .new(
      icon: Icons.delete_outline,
      label: trash ? context.t.trash : context.t.delete,
      onAction: () => _delete(context, ref),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final state = ref.read(_stateProvider(source));
    if (state == null) {
      return;
    }

    final (:localIds, :remoteIds, :trash, :isLocalOnly) = state;
    final assetService = ref.read(assetServiceProvider);
    final toastService = ref.read(toastServiceProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      final String? message;
      // Only trashing is reversible; a permanent delete and a device cleanup are not.
      ToastOption? undo;
      if (remoteIds.isEmpty) {
        message = await _removeLocalAssets(context, ref, localIds, isLocalOnly: isLocalOnly);
      } else if (trash) {
        message = await _moveToTrash(context, ref, remoteIds, localIds, isLocalOnly: isLocalOnly);
        undo = .new(onUndo: () => assetService.restoreTrash(remoteIds));
      } else {
        message = await _deletePermanently(context, ref, remoteIds, localIds);
      }

      if (message == null) {
        return;
      }

      toastService.success(message, toast: undo);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to delete assets");
    }
  }

  Future<String?> _removeLocalAssets(
    BuildContext context,
    WidgetRef ref,
    List<String> localIds, {
    required bool isLocalOnly,
  }) async {
    final count = await _cleanupLocalAssets(context, ref, localIds, isLocalOnly: isLocalOnly);
    if (count <= 0 || !context.mounted) {
      return null;
    }

    return context.t.cleanup_deleted_assets(count: count);
  }

  Future<String?> _moveToTrash(
    BuildContext context,
    WidgetRef ref,
    List<String> remoteIds,
    List<String> localIds, {
    required bool isLocalOnly,
  }) async {
    final assetService = ref.read(assetServiceProvider);
    if (localIds.isNotEmpty) {
      await _cleanupLocalAssets(context, ref, localIds, isLocalOnly: isLocalOnly);
      if (!context.mounted) {
        return null;
      }
    }

    final message = context.t.trash_action_prompt(count: remoteIds.length);
    await assetService.trash(remoteIds);
    return message;
  }

  Future<String?> _deletePermanently(
    BuildContext context,
    WidgetRef ref,
    List<String> remoteIds,
    List<String> localIds,
  ) async {
    final assetService = ref.read(assetServiceProvider);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => ConfirmDialog(
        title: context.t.delete_dialog_title,
        content: context.t.delete_dialog_alert,
        ok: context.t.delete_permanently,
      ),
    );
    if (confirmed != true || !context.mounted) {
      return null;
    }

    final message = context.t.delete_permanently_action_prompt(count: remoteIds.length);
    // Server first, so a failed request will not remove the local copy
    await assetService.delete(remoteIds);
    if (localIds.isNotEmpty && context.mounted) {
      await _cleanupLocalAssets(context, ref, localIds, requestCustomPrompt: false);
    }

    return message;
  }
}

final _cleanupStateProvider = Provider.family.autoDispose<List<String>?, ActionSource>((ref, source) {
  final assets = ref.watch(assetsActionProvider(source));
  final assetIds = assets.backedUp().map((asset) => asset.localId).nonNulls.toList(growable: false);
  return assetIds.isEmpty ? null : assetIds;
}, dependencies: [assetsActionProvider]);

class CleanupLocalAction extends AssetActionBuilder {
  const CleanupLocalAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final isVisible = ref.watch(_cleanupStateProvider(source).select((state) => state != null));
    if (!isVisible) {
      return null;
    }

    return .new(
      icon: Icons.no_cell_outlined,
      label: context.t.control_bottom_app_bar_delete_from_local,
      onAction: () => _cleanup(context, ref),
    );
  }

  Future<void> _cleanup(BuildContext context, WidgetRef ref) async {
    final assetIds = ref.read(_cleanupStateProvider(source));
    if (assetIds == null) {
      return;
    }

    final toastService = ref.read(toastServiceProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      final count = await _cleanupLocalAssets(context, ref, assetIds);
      if (count <= 0 || !context.mounted) {
        return;
      }

      toastService.success(context.t.cleanup_deleted_assets(count: count));
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to remove the device copies");
    }
  }
}

/// Removes the device copies of [assetIds], returning how many were deleted.
Future<int> _cleanupLocalAssets(
  BuildContext context,
  WidgetRef ref,
  List<String> assetIds, {
  bool requestCustomPrompt = true,
  bool isLocalOnly = false,
}) async {
  if (assetIds.isEmpty) {
    return 0;
  }

  final cleanupService = ref.read(cleanupServiceProvider);
  if (!await _allowsDeletion(context, ref, requestCustomPrompt: requestCustomPrompt, isLocalOnly: isLocalOnly)) {
    return 0;
  }

  return cleanupService.deleteLocalAssets(assetIds);
}

/// iOS always shows a prompt and adds to on device trash
/// Android varies by API version:
///   < 30: Does not prompt by default. Immediately deletes. We provide a prompt to notify the user
///   30: Prompts by default. Immediately deletes
///   > 30: When `MANAGE_MEDIA` is present, does not prompt by default. When `MANAGE_MEDIA` is not present, does prompt
///         by default. Either way adds to trash. We provide a prompt to notify the user in the `MANAGE_MEDIA` case
Future<bool> _allowsDeletion(
  BuildContext context,
  WidgetRef ref, {
  required bool requestCustomPrompt,
  required bool isLocalOnly,
}) async {
  if (!requestCustomPrompt || !CurrentPlatform.isAndroid) {
    return true;
  }

  final manageMedia = ref.read(storeServiceProvider).get(.manageLocalMediaAndroid, false);
  final versionRequiresPrompt = await ref.read(permissionRepositoryProvider).getAndroidSdkVersion() < 30;
  if (!context.mounted) {
    return false;
  }

  final ConfirmDialog dialog;
  if (versionRequiresPrompt) {
    dialog = ConfirmDialog(
      title: context.t.delete_dialog_title,
      content: isLocalOnly ? context.t.delete_dialog_alert_local_non_backed_up : context.t.delete_dialog_alert_local,
      ok: isLocalOnly ? context.t.delete_local_dialog_ok_force : context.t.delete_permanently,
    );
  } else if (manageMedia) {
    dialog = ConfirmDialog(
      title: context.t.move_to_device_trash,
      content: context.t.free_up_space_description,
      ok: context.t.ok,
    );
  } else {
    return true;
  }

  final confirmed = await showDialog<bool>(context: context, builder: (_) => dialog);
  return confirmed == true;
}
