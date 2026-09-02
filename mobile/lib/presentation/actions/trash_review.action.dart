import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/utils/error_handler.dart';

final _selectedIdsProvider = Provider.family.autoDispose<List<String>?, ActionSource>((ref, source) {
  final ids = ref
      .watch(assetsActionProvider(source))
      .map((asset) => asset.localId)
      .nonNulls
      .toSet()
      .toList(growable: false);
  return ids.isEmpty ? null : ids;
}, dependencies: [assetsActionProvider]);

abstract class _TrashReviewAction extends ActionBuilder {
  final ActionSource? source;
  final TimelineOrigin? origin;

  const _TrashReviewAction.selected({required ActionSource this.source, required TimelineOrigin this.origin});

  const _TrashReviewAction.all() : source = null, origin = null;

  bool get isAll => source == null;

  List<String>? selectedIds(WidgetRef ref) {
    final actionSource = source;
    if (actionSource == null) {
      return null;
    }
    return ref.watch(_selectedIdsProvider(actionSource));
  }

  bool isApplicable(WidgetRef ref) {
    if (isAll) {
      return (ref.watch(pendingTrashReviewCountProvider).value ?? 0) > 0;
    }
    return origin == TimelineOrigin.syncTrash && selectedIds(ref) != null;
  }

  Future<List<String>> assetIds(WidgetRef ref) async {
    final actionSource = source;
    if (actionSource == null) {
      return ref.read(trashSyncRepositoryProvider).getPendingAssetIds();
    }
    return ref.read(_selectedIdsProvider(actionSource)) ?? const [];
  }

  void clearSelection(WidgetRef ref) {
    final actionSource = source;
    if (actionSource != null) {
      ref.read(clearSelectionProvider(actionSource))();
    }
  }

  void hideViewerControls(WidgetRef ref) {
    if (source == ActionSource.viewer) {
      ref.read(assetViewerProvider.notifier).setControls(false);
    }
  }

  void restoreViewerControls(WidgetRef ref) {
    if (source != ActionSource.viewer) {
      return;
    }
    Future.delayed(Durations.extralong4, () {
      if (ref.context.mounted) {
        ref.read(assetViewerProvider.notifier).setControls(true);
      }
    });
  }
}

class KeepOnDeviceAction extends _TrashReviewAction {
  const KeepOnDeviceAction({required super.source, required super.origin}) : super.selected();

  const KeepOnDeviceAction.all() : super.all();

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    if (!isApplicable(ref)) {
      return null;
    }

    return .new(
      icon: Icons.cloud_off_outlined,
      label: isAll
          ? context.t.keep_all
          : source == ActionSource.viewer
          ? context.t.keep
          : context.t.keep_on_device,
      onAction: () => _keep(context, ref),
    );
  }

  Future<void> _keep(BuildContext context, WidgetRef ref) async {
    final errorMessage = context.t.scaffold_body_error_occurred;
    final keptMessage = context.t.assets_kept_on_device_count;
    final ids = await assetIds(ref);
    if (ids.isEmpty) {
      return;
    }

    hideViewerControls(ref);
    try {
      final count = await ref.read(trashSyncServiceProvider).keepReviewAssets(ids);
      if (count == 0) {
        ref.read(toastServiceProvider).error(errorMessage);
        return;
      }
      ref.read(toastServiceProvider).success(keptMessage(count: count));
      clearSelection(ref);
    } catch (error, stack) {
      handleError(error, stack: stack, description: 'Failed to keep trash-review assets on device');
    } finally {
      restoreViewerControls(ref);
    }
  }
}

class MoveToTrashAction extends _TrashReviewAction {
  const MoveToTrashAction({required super.source, required super.origin}) : super.selected();

  const MoveToTrashAction.all() : super.all();

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    if (!isApplicable(ref)) {
      return null;
    }

    return .new(
      icon: Icons.delete_outline_rounded,
      label: isAll
          ? context.t.trash_all
          : source == ActionSource.viewer
          ? context.t.delete
          : context.t.control_bottom_app_bar_trash_from_immich,
      onAction: () => _trash(context, ref),
    );
  }

  Future<void> _trash(BuildContext context, WidgetRef ref) async {
    final errorMessage = context.t.errors.something_went_wrong;
    final movedMessage = context.t.assets_moved_to_trash_count;
    final ids = await assetIds(ref);
    if (ids.isEmpty || !context.mounted) {
      return;
    }

    if (await _shouldConfirm(ref) && context.mounted) {
      hideViewerControls(ref);
      final confirmationCount = isAll ? ref.read(pendingTrashReviewCountProvider).value ?? ids.length : ids.length;
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(context.t.trash_review_confirmation_title),
          content: Text(context.t.trash_review_confirmation_text(count: confirmationCount)),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(context.t.cancel)),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              child: Text(context.t.control_bottom_app_bar_trash_from_immich),
            ),
          ],
        ),
      );
      if (confirmed != true) {
        restoreViewerControls(ref);
        return;
      }
    }

    try {
      final count = await ref.read(trashSyncServiceProvider).trashReviewAssets(ids);
      if (count == 0) {
        ref.read(toastServiceProvider).error(errorMessage);
        return;
      }
      ref.read(toastServiceProvider).info(movedMessage(count: count));
      clearSelection(ref);
    } catch (error, stack) {
      handleError(error, stack: stack, description: 'Failed to move trash-review assets to trash');
    } finally {
      restoreViewerControls(ref);
    }
  }

  Future<bool> _shouldConfirm(WidgetRef ref) {
    if (isAll) {
      return Future.value(true);
    }
    if (CurrentPlatform.isIOS) {
      return Future.value(false);
    }
    return ref.read(permissionRepositoryProvider).hasManageMediaPermission();
  }
}
