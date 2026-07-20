import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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

class TrashAction extends BaseAction {
  const TrashAction();

  @override
  IconData get icon => Icons.delete_outline;

  @override
  String label(context) => context.t.trash;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) {
    final (:remoteAssets, localIds: _) = groupAssets(currentUser(ref).id, assets);
    if (remoteAssets.isEmpty || isPermanentDelete(remoteAssets)) {
      return false;
    }

    return ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
  }

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final (:remoteAssets, :localIds) = groupAssets(currentUser(ref).id, assets);
    final remoteIds = remoteAssets.map((asset) => asset.id);
    if (remoteIds.isEmpty) {
      return;
    }

    if (localIds.isNotEmpty) {
      await cleanupLocalAssets(ref, assetIds: localIds);
    }

    final ids = remoteIds.toList(growable: false);
    await ref.read(assetServiceProvider).trash(ids);

    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.trash_action_prompt(count: ids.length));
  }
}

class DeletePermanentlyAction extends BaseAction {
  const DeletePermanentlyAction();

  @override
  IconData get icon => Icons.delete_outline;

  @override
  String label(context) => context.t.delete;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) {
    final (:remoteAssets, localIds: _) = groupAssets(currentUser(ref).id, assets);
    if (remoteAssets.isEmpty) {
      return false;
    }

    return isPermanentDelete(remoteAssets) ||
        ref.watch(serverInfoProvider.select((state) => !state.serverFeatures.trash));
  }

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final (:remoteAssets, :localIds) = groupAssets(currentUser(ref).id, assets);
    final remoteIds = remoteAssets.map((asset) => asset.id).toList(growable: false);
    if (remoteIds.isEmpty) {
      return;
    }

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
    if (localIds.isNotEmpty) {
      await cleanupLocalAssets(ref, assetIds: localIds, requestPrompt: false);
    }
    if (!context.mounted) {
      return;
    }

    ref.read(toastRepositoryProvider).success(context.t.delete_permanently_action_prompt(count: remoteIds.length));
  }
}

class DeleteLocalAction extends BaseAction {
  const DeleteLocalAction();

  @override
  IconData get icon => Icons.delete_outline;

  @override
  String label(context) => context.t.delete;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) {
    final (:remoteAssets, :localIds) = groupAssets(currentUser(ref).id, assets);
    return remoteAssets.isEmpty && localIds.isNotEmpty;
  }

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final (:localIds, remoteAssets: _) = groupAssets(currentUser(ref).id, assets);
    if (localIds.isEmpty) {
      return;
    }

    final count = await cleanupLocalAssets(ref, assetIds: localIds);
    if (!context.mounted || count <= 0) {
      return;
    }

    ref.read(toastRepositoryProvider).success(context.t.cleanup_deleted_assets(count: count));
  }
}

@visibleForTesting
({Iterable<String> localIds, Iterable<RemoteAsset> remoteAssets}) groupAssets(
  String ownerId,
  Iterable<BaseAsset> assets,
) => (localIds: assets.map((a) => a.localId).nonNulls, remoteAssets: AssetFilter(assets).owned(ownerId));

@visibleForTesting
bool isPermanentDelete(Iterable<RemoteAsset> remoteAssets) =>
    remoteAssets.every((asset) => asset.isTrashed || asset.isLocked);

class CleanupLocalAction extends BaseAction {
  const CleanupLocalAction();

  @override
  IconData get icon => Icons.no_cell_outlined;

  @override
  String label(context) => context.t.control_bottom_app_bar_delete_from_local;

  @visibleForTesting
  Iterable<String> assetsForAction(Iterable<BaseAsset> assets) =>
      AssetFilter(assets).backedUp().map((asset) => asset.localId).nonNulls;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;

    final count = await cleanupLocalAssets(ref, assetIds: assetsForAction(assets));
    if (!context.mounted || count <= 0) {
      return;
    }

    ref.read(toastRepositoryProvider).success(context.t.cleanup_deleted_assets(count: count));
  }
}

@visibleForTesting
Future<int> cleanupLocalAssets(WidgetRef ref, {required Iterable<String> assetIds, bool requestPrompt = true}) async {
  final context = ref.context;

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

  return await ref.read(cleanupServiceProvider).deleteLocalAssets(assetIds.toList(growable: false));
}
