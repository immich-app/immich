import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/collection_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/stack.service.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/models/asset_selection_state.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/widgets/asset_grid/control_bottom_app_bar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class MultiselectGrid extends HookConsumerWidget {
  const MultiselectGrid({
    super.key,
    required this.renderListProvider,
    this.onRefresh,
    this.buildLoadingIndicator,
    this.onRemoveFromAlbum,
    this.topWidget,
    this.stackEnabled = false,
    this.archiveEnabled = false,
    this.deleteEnabled = true,
    this.favoriteEnabled = true,
    this.editEnabled = false,
    this.unarchive = false,
    this.unfavorite = false,
    this.emptyIndicator,
  });

  final ProviderListenable<AsyncValue<RenderList>> renderListProvider;
  final Future<void> Function()? onRefresh;
  final Widget Function()? buildLoadingIndicator;
  final Future<bool> Function(Iterable<Asset>)? onRemoveFromAlbum;
  final Widget? topWidget;
  final bool stackEnabled;
  final bool archiveEnabled;
  final bool unarchive;
  final bool deleteEnabled;
  final bool favoriteEnabled;
  final bool unfavorite;
  final bool editEnabled;
  final Widget? emptyIndicator;
  Widget buildDefaultLoadingIndicator() =>
      const Center(child: ImmichLoadingIndicator());

  Widget buildEmptyIndicator() =>
      emptyIndicator ?? Center(child: const Text("no_assets_to_show").tr());

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselectEnabled = ref.watch(multiselectProvider.notifier);
    final selectionEnabledHook = useState(false);
    final selectionAssetState = useState(const AssetSelectionState());

    final selection = useState(<Asset>{});
    final currentUser = ref.watch(currentUserProvider);
    final processing = useProcessingOverlay();

    useEffect(
      () {
        selectionEnabledHook.addListener(() {
          multiselectEnabled.state = selectionEnabledHook.value;
        });

        return () {
          // This does not work in tests
          if (kReleaseMode) {
            selectionEnabledHook.dispose();
          }
        };
      },
      [],
    );

    void selectionListener(
      bool multiselect,
      Set<Asset> selectedAssets,
    ) {
      selectionEnabledHook.value = multiselect;
      selection.value = selectedAssets;
      selectionAssetState.value =
          AssetSelectionState.fromSelection(selectedAssets);
    }

    errorBuilder(String? msg) => msg != null && msg.isNotEmpty
        ? () => ImmichToast.show(
              context: context,
              msg: msg,
              gravity: ToastGravity.BOTTOM,
            )
        : null;

    Iterable<Asset> ownedRemoteSelection({
      String? localErrorMessage,
      String? ownerErrorMessage,
    }) {
      final assets = selection.value;
      return assets
          .remoteOnly(errorCallback: errorBuilder(localErrorMessage))
          .ownedOnly(
            currentUser,
            errorCallback: errorBuilder(ownerErrorMessage),
          );
    }

    Iterable<Asset> remoteSelection({String? errorMessage}) =>
        selection.value.remoteOnly(
          errorCallback: errorBuilder(errorMessage),
        );

    void onShareAssets(bool shareLocal) {
      processing.value = true;
      if (shareLocal) {
        // Share = Download + Send to OS specific share sheet
        handleShareAssets(ref, context, selection.value);
      } else {
        final ids =
            remoteSelection(errorMessage: "home_page_share_err_local".tr())
                .map((e) => e.remoteId!);
        context.pushRoute(SharedLinkEditRoute(assetsList: ids.toList()));
      }
      processing.value = false;
      selectionEnabledHook.value = false;
    }

    void onFavoriteAssets() async {
      processing.value = true;
      try {
        final remoteAssets = ownedRemoteSelection(
          localErrorMessage: 'home_page_favorite_err_local'.tr(),
          ownerErrorMessage: 'home_page_favorite_err_partner'.tr(),
        );
        if (remoteAssets.isNotEmpty) {
          await handleFavoriteAssets(ref, context, remoteAssets.toList());
        }
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    void onArchiveAsset() async {
      processing.value = true;
      try {
        final remoteAssets = ownedRemoteSelection(
          localErrorMessage: 'home_page_archive_err_local'.tr(),
          ownerErrorMessage: 'home_page_archive_err_partner'.tr(),
        );
        await handleArchiveAssets(ref, context, remoteAssets.toList());
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    void onDelete([bool force = false]) async {
      processing.value = true;
      try {
        final toDelete = selection.value
            .ownedOnly(
              currentUser,
              errorCallback: errorBuilder('home_page_delete_err_partner'.tr()),
            )
            .toList();
        final isDeleted = await ref
            .read(assetProvider.notifier)
            .deleteAssets(toDelete, force: force);

        if (isDeleted) {
          ImmichToast.show(
            context: context,
            msg: force
                ? 'assets_deleted_permanently'
                    .tr(args: ["${selection.value.length}"])
                : 'assets_trashed'.tr(args: ["${selection.value.length}"]),
            gravity: ToastGravity.BOTTOM,
          );
          selectionEnabledHook.value = false;
        }
      } finally {
        processing.value = false;
      }
    }

    void onDeleteLocal(bool onlyBackedUp) async {
      processing.value = true;
      try {
        final localIds = selection.value.where((a) => a.isLocal).toList();

        final isDeleted = await ref
            .read(assetProvider.notifier)
            .deleteLocalOnlyAssets(localIds, onlyBackedUp: onlyBackedUp);
        if (isDeleted) {
          ImmichToast.show(
            context: context,
            msg: 'assets_removed_permanently_from_device'
                .tr(args: ["${localIds.length}"]),
            gravity: ToastGravity.BOTTOM,
          );
          selectionEnabledHook.value = false;
        }
      } finally {
        processing.value = false;
      }
    }

    void onDeleteRemote([bool force = false]) async {
      processing.value = true;
      try {
        final toDelete = ownedRemoteSelection(
          localErrorMessage: 'home_page_delete_remote_err_local'.tr(),
          ownerErrorMessage: 'home_page_delete_err_partner'.tr(),
        ).toList();

        final isDeleted = await ref
            .read(assetProvider.notifier)
            .deleteRemoteOnlyAssets(toDelete, force: force);
        if (isDeleted) {
          ImmichToast.show(
            context: context,
            msg: force
                ? 'assets_deleted_permanently_from_server'
                    .tr(args: ["${toDelete.length}"])
                : 'assets_trashed_from_server'.tr(args: ["${toDelete.length}"]),
            gravity: ToastGravity.BOTTOM,
          );
        }
      } finally {
        selectionEnabledHook.value = false;
        processing.value = false;
      }
    }

    void onUpload() {
      processing.value = true;
      selectionEnabledHook.value = false;
      try {
        ref.read(manualUploadProvider.notifier).uploadAssets(
              context,
              selection.value.where((a) => a.storage == AssetState.local),
            );
      } finally {
        processing.value = false;
      }
    }

    void onAddToAlbum(Album album) async {
      processing.value = true;
      try {
        final Iterable<Asset> assets = remoteSelection(
          errorMessage: "home_page_add_to_album_err_local".tr(),
        );
        if (assets.isEmpty) {
          return;
        }
        final result = await ref.read(albumServiceProvider).addAssets(
              album,
              assets,
            );

        if (result != null) {
          if (result.alreadyInAlbum.isNotEmpty) {
            ImmichToast.show(
              context: context,
              msg: "home_page_add_to_album_conflicts".tr(
                namedArgs: {
                  "album": album.name,
                  "added": result.successfullyAdded.toString(),
                  "failed": result.alreadyInAlbum.length.toString(),
                },
              ),
            );
          } else {
            ImmichToast.show(
              context: context,
              msg: "home_page_add_to_album_success".tr(
                namedArgs: {
                  "album": album.name,
                  "added": result.successfullyAdded.toString(),
                },
              ),
              toastType: ToastType.success,
            );
          }
        }
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    void onCreateNewAlbum() async {
      processing.value = true;
      try {
        final Iterable<Asset> assets = remoteSelection(
          errorMessage: "home_page_add_to_album_err_local".tr(),
        );
        if (assets.isEmpty) {
          return;
        }
        final result = await ref
            .read(albumServiceProvider)
            .createAlbumWithGeneratedName(assets);

        if (result != null) {
          ref.watch(albumProvider.notifier).refreshRemoteAlbums();
          selectionEnabledHook.value = false;

          context.pushRoute(AlbumViewerRoute(albumId: result.id));
        }
      } finally {
        processing.value = false;
      }
    }

    void onStack() async {
      try {
        processing.value = true;
        if (!selectionEnabledHook.value || selection.value.length < 2) {
          return;
        }

        await ref.read(stackServiceProvider).createStack(
              selection.value.map((e) => e.remoteId!).toList(),
            );
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    void onEditTime() async {
      try {
        final remoteAssets = ownedRemoteSelection(
          localErrorMessage: 'home_page_favorite_err_local'.tr(),
          ownerErrorMessage: 'home_page_favorite_err_partner'.tr(),
        );

        if (remoteAssets.isNotEmpty) {
          handleEditDateTime(ref, context, remoteAssets.toList());
        }
      } finally {
        selectionEnabledHook.value = false;
      }
    }

    void onEditLocation() async {
      try {
        final remoteAssets = ownedRemoteSelection(
          localErrorMessage: 'home_page_favorite_err_local'.tr(),
          ownerErrorMessage: 'home_page_favorite_err_partner'.tr(),
        );

        if (remoteAssets.isNotEmpty) {
          handleEditLocation(ref, context, remoteAssets.toList());
        }
      } finally {
        selectionEnabledHook.value = false;
      }
    }

    Future<T> Function() wrapLongRunningFun<T>(
      Future<T> Function() fun, {
      bool showOverlay = true,
    }) =>
        () async {
          if (showOverlay) processing.value = true;
          try {
            final result = await fun();
            if (result.runtimeType != bool || result == true) {
              selectionEnabledHook.value = false;
            }
            return result;
          } finally {
            if (showOverlay) processing.value = false;
          }
        };

    return SafeArea(
      top: true,
      bottom: false,
      child: Stack(
        children: [
          ref.watch(renderListProvider).when(
                data: (data) => data.isEmpty &&
                        (buildLoadingIndicator != null || topWidget == null)
                    ? (buildLoadingIndicator ?? buildEmptyIndicator)()
                    : ImmichAssetGrid(
                        renderList: data,
                        listener: selectionListener,
                        selectionActive: selectionEnabledHook.value,
                        onRefresh: onRefresh == null
                            ? null
                            : wrapLongRunningFun(
                                onRefresh!,
                                showOverlay: false,
                              ),
                        topWidget: topWidget,
                        showStack: stackEnabled,
                      ),
                error: (error, _) => Center(child: Text(error.toString())),
                loading: buildLoadingIndicator ?? buildDefaultLoadingIndicator,
              ),
          if (selectionEnabledHook.value)
            ControlBottomAppBar(
              onShare: onShareAssets,
              onFavorite: favoriteEnabled ? onFavoriteAssets : null,
              onArchive: archiveEnabled ? onArchiveAsset : null,
              onDelete: deleteEnabled ? onDelete : null,
              onDeleteServer: deleteEnabled ? onDeleteRemote : null,

              /// local file deletion is allowed irrespective of [deleteEnabled] since it has
              /// nothing to do with the state of the asset in the Immich server
              onDeleteLocal: onDeleteLocal,
              onAddToAlbum: onAddToAlbum,
              onCreateNewAlbum: onCreateNewAlbum,
              onUpload: onUpload,
              enabled: !processing.value,
              selectionAssetState: selectionAssetState.value,
              onStack: stackEnabled ? onStack : null,
              onEditTime: editEnabled ? onEditTime : null,
              onEditLocation: editEnabled ? onEditLocation : null,
              unfavorite: unfavorite,
              unarchive: unarchive,
              onRemoveFromAlbum: onRemoveFromAlbum != null
                  ? wrapLongRunningFun(
                      () => onRemoveFromAlbum!(selection.value),
                    )
                  : null,
            ),
        ],
      ),
    );
  }
}
