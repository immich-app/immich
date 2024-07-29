import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/shared_album.provider.dart';
import 'package:immich_mobile/widgets/album/add_to_album_sliverlist.dart';
import 'package:immich_mobile/models/asset_selection_state.dart';
import 'package:immich_mobile/widgets/asset_grid/delete_dialog.dart';
import 'package:immich_mobile/widgets/asset_grid/upload_dialog.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/widgets/common/drag_sheet.dart';
import 'package:immich_mobile/entities/album.entity.dart';
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

  final bool enabled;
  final bool unfavorite;
  final bool unarchive;
  final AssetSelectionState selectionAssetState;

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
    this.onStack,
    this.onEditTime,
    this.onEditLocation,
    this.onRemoveFromAlbum,
    this.selectionAssetState = const AssetSelectionState(),
    this.enabled = true,
    this.unarchive = false,
    this.unfavorite = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasRemote =
        selectionAssetState.hasRemote || selectionAssetState.hasMerged;
    final hasLocal =
        selectionAssetState.hasLocal || selectionAssetState.hasMerged;
    final trashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    final albums = ref.watch(albumProvider).where((a) => a.isRemote).toList();
    final sharedAlbums = ref.watch(sharedAlbumProvider);
    const bottomPadding = 0.20;
    final scrollController = useDraggableScrollController();

    void minimize() {
      scrollController.animateTo(
        bottomPadding,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }

    useEffect(
      () {
        controlBottomAppBarNotifier.addListener(minimize);
        return () {
          controlBottomAppBarNotifier.removeListener(minimize);
        };
      },
      [],
    );

    void showForceDeleteDialog(
      Function(bool) deleteCb, {
      String? alertMsg,
    }) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return DeleteDialog(
            alert: alertMsg,
            onDelete: () => deleteCb(true),
          );
        },
      );
    }

    void handleRemoteDelete(
      bool force,
      Function(bool) deleteCb, {
      String? alertMsg,
    }) {
      if (!force) {
        deleteCb(force);
        return;
      }
      return showForceDeleteDialog(deleteCb, alertMsg: alertMsg);
    }

    List<Widget> renderActionButtons() {
      return [
        if (hasRemote)
          ControlBoxButton(
            iconData: Icons.share_rounded,
            label: "control_bottom_app_bar_share".tr(),
            onPressed: enabled ? () => onShare(false) : null,
          ),
        ControlBoxButton(
          iconData: Icons.ios_share_rounded,
          label: "control_bottom_app_bar_share_to".tr(),
          onPressed: enabled ? () => onShare(true) : null,
        ),
        if (hasRemote && onArchive != null)
          ControlBoxButton(
            iconData: unarchive ? Icons.unarchive : Icons.archive,
            label: (unarchive
                    ? "control_bottom_app_bar_unarchive"
                    : "control_bottom_app_bar_archive")
                .tr(),
            onPressed: enabled ? onArchive : null,
          ),
        if (hasRemote && onFavorite != null)
          ControlBoxButton(
            iconData: unfavorite
                ? Icons.favorite_border_rounded
                : Icons.favorite_rounded,
            label: (unfavorite
                    ? "control_bottom_app_bar_unfavorite"
                    : "control_bottom_app_bar_favorite")
                .tr(),
            onPressed: enabled ? onFavorite : null,
          ),
        if (hasLocal && hasRemote && onDelete != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.delete_sweep_outlined,
              label: "control_bottom_app_bar_delete".tr(),
              onPressed: enabled
                  ? () => handleRemoteDelete(!trashEnabled, onDelete!)
                  : null,
              onLongPressed:
                  enabled ? () => showForceDeleteDialog(onDelete!) : null,
            ),
          ),
        if (hasRemote && onDeleteServer != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 85),
            child: ControlBoxButton(
              iconData: Icons.cloud_off_outlined,
              label: trashEnabled
                  ? "control_bottom_app_bar_trash_from_immich".tr()
                  : "control_bottom_app_bar_delete_from_immich".tr(),
              onPressed: enabled
                  ? () => handleRemoteDelete(
                        !trashEnabled,
                        onDeleteServer!,
                        alertMsg: "delete_dialog_alert_remote",
                      )
                  : null,
              onLongPressed: enabled
                  ? () => showForceDeleteDialog(
                        onDeleteServer!,
                        alertMsg: "delete_dialog_alert_remote",
                      )
                  : null,
            ),
          ),
        if (hasLocal && onDeleteLocal != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 85),
            child: ControlBoxButton(
              iconData: Icons.no_cell_rounded,
              label: "control_bottom_app_bar_delete_from_local".tr(),
              onPressed: enabled
                  ? () {
                      if (!selectionAssetState.hasLocal) {
                        return onDeleteLocal?.call(true);
                      }

                      showDialog(
                        context: context,
                        builder: (BuildContext context) {
                          return DeleteLocalOnlyDialog(
                            onDeleteLocal: onDeleteLocal!,
                          );
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
        if (!selectionAssetState.hasLocal &&
            selectionAssetState.selectedCount > 1 &&
            onStack != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.filter_none_rounded,
              label: "control_bottom_app_bar_stack".tr(),
              onPressed: enabled ? onStack : null,
            ),
          ),
        if (onRemoveFromAlbum != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: ControlBoxButton(
              iconData: Icons.delete_sweep_rounded,
              label: 'album_viewer_appbar_share_remove'.tr(),
              onPressed: enabled ? onRemoveFromAlbum : null,
            ),
          ),
        if (selectionAssetState.hasLocal)
          ControlBoxButton(
            iconData: Icons.backup_outlined,
            label: "control_bottom_app_bar_upload".tr(),
            onPressed: enabled
                ? () => showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return UploadDialog(
                          onUpload: onUpload,
                        );
                      },
                    )
                : null,
          ),
      ];
    }

    return DraggableScrollableSheet(
      controller: scrollController,
      initialChildSize: hasRemote ? 0.35 : bottomPadding,
      minChildSize: bottomPadding,
      maxChildSize: hasRemote ? 0.65 : bottomPadding,
      snap: true,
      builder: (
        BuildContext context,
        ScrollController scrollController,
      ) {
        return Card(
          color: context.isDarkTheme ? Colors.grey[900] : Colors.grey[100],
          surfaceTintColor: Colors.transparent,
          elevation: 18.0,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(12),
              topRight: Radius.circular(12),
            ),
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
                      height: 100,
                      child: ListView(
                        shrinkWrap: true,
                        scrollDirection: Axis.horizontal,
                        children: renderActionButtons(),
                      ),
                    ),
                    if (hasRemote)
                      const Divider(
                        indent: 16,
                        endIndent: 16,
                        thickness: 1,
                      ),
                    if (hasRemote)
                      _AddToAlbumTitleRow(
                        onCreateNewAlbum: enabled ? onCreateNewAlbum : null,
                      ),
                  ],
                ),
              ),
              if (hasRemote)
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
  const _AddToAlbumTitleRow({
    required this.onCreateNewAlbum,
  });

  final VoidCallback? onCreateNewAlbum;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            "common_add_to_album",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
          TextButton.icon(
            onPressed: onCreateNewAlbum,
            icon: Icon(
              Icons.add,
              color: context.primaryColor,
            ),
            label: Text(
              "common_create_new_album",
              style: TextStyle(
                color: context.primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ).tr(),
          ),
        ],
      ),
    );
  }
}
