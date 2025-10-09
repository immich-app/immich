import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/widgets/album/add_to_album_sliverlist.dart';
import 'package:immich_mobile/widgets/album/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/models/asset_selection_state.dart';
import 'package:immich_mobile/widgets/asset_grid/delete_dialog.dart';
import 'package:immich_mobile/widgets/asset_grid/upload_dialog.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/widgets/common/drag_sheet.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/utils/draggable_scroll_controller.dart';

final controlBottomAppBarNotifier = ControlBottomAppBarNotifier();

class ControlBottomAppBarNotifier with ChangeNotifier {
  void minimize() {
    notifyListeners();
  }
}

class ControlBottomAppBar extends HookConsumerWidget {
  final void Function(bool shareLocal) onShare;
  final void Function()? onFavorite;
  final void Function()? onArchive;
  final void Function([bool force])? onDelete;
  final void Function([bool force])? onDeleteServer;
  final void Function(bool onlyBackedUp)? onDeleteLocal;
  final Function(Album album) onAddToAlbum;
  final void Function() onCreateNewAlbum;
  final void Function() onUpload;
  final void Function()? onStack;
  final void Function()? onEditTime;
  final void Function()? onEditLocation;
  final void Function()? onRemoveFromAlbum;
  final void Function()? onToggleLocked;
  final void Function()? onDownload;

  final bool enabled;
  final bool unfavorite;
  final bool unarchive;
  final AssetSelectionState selectionAssetState;
  final List<Asset> selectedAssets;

  const ControlBottomAppBar({
    super.key,
    required this.onShare,
    this.onFavorite,
    this.onArchive,
    this.onDelete,
    this.onDeleteServer,
    this.onDeleteLocal,
    required this.onAddToAlbum,
    required this.onCreateNewAlbum,
    required this.onUpload,
    this.onDownload,
    this.onStack,
    this.onEditTime,
    this.onEditLocation,
    this.onRemoveFromAlbum,
    this.onToggleLocked,
    this.selectionAssetState = const AssetSelectionState(),
    this.selectedAssets = const [],
    this.enabled = true,
    this.unarchive = false,
    this.unfavorite = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasRemote = selectionAssetState.hasRemote || selectionAssetState.hasMerged;
    final hasLocal = selectionAssetState.hasLocal || selectionAssetState.hasMerged;
    final trashEnabled = ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    final albums = ref.watch(albumProvider).where((a) => a.isRemote).toList();
    final sharedAlbums = ref.watch(albumProvider).where((a) => a.shared).toList();
    const bottomPadding = 0.24;
    final scrollController = useDraggableScrollController();
    final isInLockedView = ref.watch(inLockedViewProvider);

    void minimize() {
      scrollController.animateTo(bottomPadding, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }

    useEffect(() {
      controlBottomAppBarNotifier.addListener(minimize);
      return () {
        controlBottomAppBarNotifier.removeListener(minimize);
      };
    }, []);

    void showForceDeleteDialog(Function(bool) deleteCb, {String? alertMsg}) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return DeleteDialog(alert: alertMsg, onDelete: () => deleteCb(true));
        },
      );
    }

    /// Show existing AddToAlbumBottomSheet
    void showAddToAlbumBottomSheet() {
      showModalBottomSheet(
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(15.0))),
        context: context,
        builder: (BuildContext _) {
          return AddToAlbumBottomSheet(assets: selectedAssets);
        },
      );
    }

    void handleRemoteDelete(bool force, Function(bool) deleteCb, {String? alertMsg}) {
      if (!force) {
        deleteCb(force);
        return;
      }
      return showForceDeleteDialog(deleteCb, alertMsg: alertMsg);
    }

    List<Widget> renderActionButtons() {
      return [
        ControlBoxButton(
          iconData: Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
          label: "share".tr(),
          onPressed: enabled ? () => onShare(true) : null,
        ),
        if (!isInLockedView && hasRemote)
          ControlBoxButton(
            iconData: Icons.link_rounded,
            label: "share_link".tr(),
            onPressed: enabled ? () => onShare(false) : null,
          ),
        if (!isInLockedView && hasRemote && albums.isNotEmpty)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 100),
            child: ControlBoxButton(
              iconData: Icons.photo_album,
              label: "add_to_album".tr(),
              onPressed: enabled ? showAddToAlbumBottomSheet : null,
            ),
          ),
        if (hasRemote && onArchive != null)
          ControlBoxButton(
            iconData: unarchive ? Icons.unarchive_outlined : Icons.archive_outlined,
            label: (unarchive ? "unarchive" : "archive").tr(),
            onPressed: enabled ? onArchive : null,
          ),
        if (hasRemote && onFavorite != null)
          ControlBoxButton(
            iconData: unfavorite ? Icons.favorite_border_rounded : Icons.favorite_rounded,
            label: (unfavorite ? "unfavorite" : "favorite").tr(),
            onPressed: enabled ? onFavorite : null,
          ),
        if (hasRemote && onDownload != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(iconData: Icons.download, label: "download".tr(), onPressed: onDownload),
          ),
        if (hasLocal && hasRemote && onDelete != null && !isInLockedView)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.delete_sweep_outlined,
              label: "delete".tr(),
              onPressed: enabled ? () => handleRemoteDelete(!trashEnabled, onDelete!) : null,
              onLongPressed: enabled ? () => showForceDeleteDialog(onDelete!) : null,
            ),
          ),
        if (hasRemote && onDeleteServer != null && !isInLockedView)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 85),
            child: ControlBoxButton(
              iconData: Icons.cloud_off_outlined,
              label: trashEnabled
                  ? "control_bottom_app_bar_trash_from_immich".tr()
                  : "control_bottom_app_bar_delete_from_immich".tr(),
              onPressed: enabled
                  ? () => handleRemoteDelete(!trashEnabled, onDeleteServer!, alertMsg: "delete_dialog_alert_remote")
                  : null,
              onLongPressed: enabled
                  ? () => showForceDeleteDialog(onDeleteServer!, alertMsg: "delete_dialog_alert_remote")
                  : null,
            ),
          ),
        if (isInLockedView)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 110),
            child: ControlBoxButton(
              iconData: Icons.delete_forever,
              label: "delete_dialog_title".tr(),
              onPressed: enabled
                  ? () => showForceDeleteDialog(onDeleteServer!, alertMsg: "delete_dialog_alert_remote")
                  : null,
            ),
          ),
        if (hasLocal && onDeleteLocal != null && !isInLockedView)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 95),
            child: ControlBoxButton(
              iconData: Icons.no_cell_outlined,
              label: "control_bottom_app_bar_delete_from_local".tr(),
              onPressed: enabled
                  ? () {
                      if (!selectionAssetState.hasLocal) {
                        return onDeleteLocal?.call(true);
                      }

                      showDialog(
                        context: context,
                        builder: (BuildContext context) {
                          return DeleteLocalOnlyDialog(onDeleteLocal: onDeleteLocal!);
                        },
                      );
                    }
                  : null,
            ),
          ),
        if (hasRemote && onEditTime != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 95),
            child: ControlBoxButton(
              iconData: Icons.edit_calendar_outlined,
              label: "control_bottom_app_bar_edit_time".tr(),
              onPressed: enabled ? onEditTime : null,
            ),
          ),
        if (hasRemote && onEditLocation != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.edit_location_alt_outlined,
              label: "control_bottom_app_bar_edit_location".tr(),
              onPressed: enabled ? onEditLocation : null,
            ),
          ),
        if (hasRemote)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 100),
            child: ControlBoxButton(
              iconData: isInLockedView ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
              label: isInLockedView ? "remove_from_locked_folder".tr() : "move_to_locked_folder".tr(),
              onPressed: enabled ? onToggleLocked : null,
            ),
          ),
        if (!selectionAssetState.hasLocal && selectionAssetState.selectedCount > 1 && onStack != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.filter_none_rounded,
              label: "stack".tr(),
              onPressed: enabled ? onStack : null,
            ),
          ),
        if (onRemoveFromAlbum != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.remove_circle_outline,
              label: 'remove_from_album'.tr(),
              onPressed: enabled ? onRemoveFromAlbum : null,
            ),
          ),
        if (selectionAssetState.hasLocal)
          ControlBoxButton(
            iconData: Icons.backup_outlined,
            label: "upload".tr(),
            onPressed: enabled
                ? () => showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return UploadDialog(onUpload: onUpload);
                    },
                  )
                : null,
          ),
      ];
    }

    getInitialSize() {
      if (isInLockedView) {
        return bottomPadding;
      }
      if (hasRemote) {
        return 0.35;
      }
      return bottomPadding;
    }

    getMaxChildSize() {
      if (isInLockedView) {
        return bottomPadding;
      }
      if (hasRemote) {
        return 0.65;
      }
      return bottomPadding;
    }

    return DraggableScrollableSheet(
      initialChildSize: getInitialSize(),
      minChildSize: bottomPadding,
      maxChildSize: getMaxChildSize(),
      snap: true,
      controller: scrollController,
      builder: (BuildContext context, ScrollController scrollController) {
        return Card(
          color: context.colorScheme.surfaceContainerHigh,
          surfaceTintColor: context.colorScheme.surfaceContainerHigh,
          elevation: 6.0,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
          ),
          margin: const EdgeInsets.all(0),
          child: CustomScrollView(
            controller: scrollController,
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: <Widget>[
                    const SizedBox(height: 12),
                    const CustomDraggingHandle(),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 120,
                      child: ListView(
                        shrinkWrap: true,
                        scrollDirection: Axis.horizontal,
                        children: renderActionButtons(),
                      ),
                    ),
                    if (hasRemote && !isInLockedView) ...[
                      const Divider(indent: 16, endIndent: 16, thickness: 1),
                      _AddToAlbumTitleRow(onCreateNewAlbum: enabled ? onCreateNewAlbum : null),
                    ],
                  ],
                ),
              ),
              if (hasRemote && !isInLockedView)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: AddToAlbumSliverList(
                    albums: albums,
                    sharedAlbums: sharedAlbums,
                    onAddToAlbum: onAddToAlbum,
                    enabled: enabled,
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _AddToAlbumTitleRow extends StatelessWidget {
  const _AddToAlbumTitleRow({required this.onCreateNewAlbum});

  final VoidCallback? onCreateNewAlbum;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text("add_to_album", style: context.textTheme.titleSmall).tr(),
          TextButton.icon(
            onPressed: onCreateNewAlbum,
            icon: Icon(Icons.add, color: context.primaryColor),
            label: Text(
              "common_create_new_album",
              style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
            ).tr(),
          ),
        ],
      ),
    );
  }
}
