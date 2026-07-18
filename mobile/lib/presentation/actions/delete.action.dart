import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/services/cleanup.service.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

class DeleteAction extends BaseAction {
  final List<String> localIds;
  final List<String> remoteIds;
  final bool trash;

  DeleteAction._({
    required this.localIds,
    required this.remoteIds,
    required super.scope,
    required this.trash,
    super.isVisible,
  }) : super(icon: Icons.delete_outline, label: trash ? scope.context.t.trash : scope.context.t.delete);

  factory DeleteAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final ActionScope(:ref) = scope;

    final localIds = <String>[];
    final ownedRemote = <RemoteAsset>[];
    for (final asset in assets) {
      if (asset.localId case final id?) {
        localIds.add(id);
      }

      if (asset case final RemoteAsset remote when remote.ownerId == scope.authUser.id) {
        ownedRemote.add(remote);
      }
    }
    final remoteIds = ownedRemote.map((asset) => asset.id).toList(growable: false);

    final trashEnabled = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
    // Assets already in trash or in locked page should be permanently deleted irrespective of the trash feature being enabled
    final trash = trashEnabled && !ownedRemote.every((asset) => asset.isTrashed || asset.isLocked);

    return ._(
      localIds: localIds,
      remoteIds: remoteIds,
      trash: trash,
      scope: scope,
      isVisible: remoteIds.isNotEmpty || localIds.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final toast = ref.read(toastRepositoryProvider);

    // Local-only
    // Single prompt on iOS & Android (without MANAGE_MEDIA)
    // No prompt on Android (with MANAGE_MEDIA)
    if (remoteIds.isEmpty) {
      if (localIds.isEmpty) {
        return;
      }

      final count = await cleanupLocalAssets(assetIds: localIds, scope: scope);
      if (!context.mounted || count <= 0) {
        return;
      }
      toast.success(context.t.cleanup_deleted_assets(count: count));
      return;
    }

    // Trash
    // No prompt on Android (with MANAGE_MEDIA)
    // Single prompt on iOS & Android (without MANAGE_MEDIA)
    // TODO(shenlong): Handle the native prompt response and skip deleting trash when user cancels the prompt
    if (trash) {
      if (localIds.isNotEmpty) {
        await cleanupLocalAssets(assetIds: localIds, scope: scope);
        if (!context.mounted) {
          return;
        }
      }
      await ref.read(assetServiceProvider).trash(remoteIds);
      toast.success(context.t.trash_action_prompt(count: remoteIds.length));
      return;
    }

    // Permanent delete
    // Single prompt on Android (with MANAGE_MEDIA)
    // Double prompts on iOS & Android (without MANAGE_MEDIA)
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) =>
          const ConfirmDialog(title: 'delete_dialog_title', content: 'delete_dialog_alert', ok: 'delete_permanently'),
    );
    if (confirmed != true || !context.mounted) {
      return;
    }

    // Perform server deletion first so we don't remove the only local copy if the server delete fails
    await ref.read(assetServiceProvider).delete(remoteIds);
    if (localIds.isNotEmpty && context.mounted) {
      await cleanupLocalAssets(assetIds: localIds, scope: scope, requestPrompt: false);
    }

    if (!context.mounted) {
      return;
    }

    toast.success(context.t.delete_permanently_action_prompt(count: remoteIds.length));
  }
}

class CleanupLocalAction extends BaseAction {
  final List<String> assetIds;

  CleanupLocalAction._({required this.assetIds, required super.scope})
    : super(
        icon: Icons.no_cell_outlined,
        label: scope.context.t.control_bottom_app_bar_delete_from_local,
        isVisible: assetIds.isNotEmpty,
      );

  factory CleanupLocalAction({required Iterable<BaseAsset> assets, required ActionScope scope}) => ._(
    assetIds: AssetFilter(assets).backedUp().map((asset) => asset.localId).nonNulls.toList(growable: false),
    scope: scope,
  );

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final count = await cleanupLocalAssets(assetIds: assetIds, scope: scope);
    if (!context.mounted || count <= 0) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.cleanup_deleted_assets(count: count));
  }
}

@visibleForTesting
Future<int> cleanupLocalAssets({
  required List<String> assetIds,
  required ActionScope scope,
  bool requestPrompt = true,
}) async {
  final ActionScope(:ref, :context) = scope;

  /// OS prompts on iOS & Android (without MANAGE_MEDIA)
  /// Custom prompt on Android (with MANAGE_MEDIA)
  final requireUserPrompt =
      requestPrompt && CurrentPlatform.isAndroid && ref.read(storeServiceProvider).get(.manageLocalMediaAndroid, false);
  if (requireUserPrompt) {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => ConfirmDialog(
        title: context.t.move_to_device_trash,
        content: context.t.free_up_space_description,
        ok: context.t.ok,
      ),
    );

    if (confirmed != true) {
      return 0;
    }
  }

  if (!context.mounted) {
    return 0;
  }

  return await ref.read(cleanupServiceProvider).deleteLocalAssets(assetIds);
}
