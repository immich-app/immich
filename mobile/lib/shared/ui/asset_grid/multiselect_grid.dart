import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/asset_viewer/services/asset_stack.service.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/home/models/selection_state.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/home/ui/control_bottom_app_bar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class MultiselectGrid extends HookConsumerWidget {
  const MultiselectGrid({
    Key? key,
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
  }) : super(key: key);

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

  Widget buildDefaultLoadingIndicator() =>
      const Center(child: ImmichLoadingIndicator());

  Widget buildEmptyIndicator() =>
      const Center(child: Text("No assets to show"));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselectEnabled = ref.watch(multiselectProvider.notifier);
    final selectionEnabledHook = useState(false);
    final selectionAssetState = useState(const SelectionAssetState());

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
          SelectionAssetState.fromSelection(selectedAssets);
    }

    errorBuilder(String? msg) => msg != null && msg.isNotEmpty
        ? () => ImmichToast.show(
              context: context,
              msg: msg,
              gravity: ToastGravity.BOTTOM,
            )
        : null;

    Iterable<Asset> remoteOnly(
      Iterable<Asset> assets, {
      void Function()? errorCallback,
    }) {
      final bool onlyRemote = assets.every((e) => e.isRemote);
      if (!onlyRemote) {
        if (errorCallback != null) errorCallback();
        return assets.where((a) => a.isRemote);
      }
      return assets;
    }

    Iterable<Asset> ownedOnly(
      Iterable<Asset> assets, {
      void Function()? errorCallback,
    }) {
      if (currentUser == null) return [];
      final userId = currentUser.isarId;
      final bool onlyOwned = assets.every((e) => e.ownerId == userId);
      if (!onlyOwned) {
        if (errorCallback != null) errorCallback();
        return assets.where((a) => a.ownerId == userId);
      }
      return assets;
    }

    Iterable<Asset> ownedRemoteSelection({
      String? localErrorMessage,
      String? ownerErrorMessage,
    }) {
      final assets = selection.value;
      return remoteOnly(
        ownedOnly(assets, errorCallback: errorBuilder(ownerErrorMessage)),
        errorCallback: errorBuilder(localErrorMessage),
      );
    }

    Iterable<Asset> remoteSelection({String? errorMessage}) => remoteOnly(
          selection.value,
          errorCallback: errorBuilder(errorMessage),
        );

    void onShareAssets(bool shareLocal) {
      processing.value = true;
      if (shareLocal) {
        handleShareAssets(ref, context, selection.value.toList());
      } else {
        final ids =
            remoteSelection(errorMessage: "home_page_share_err_local".tr())
                .map((e) => e.remoteId!);
        context.autoPush(SharedLinkEditRoute(assetsList: ids.toList()));
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

    void onDelete() async {
      processing.value = true;
      try {
        final trashEnabled =
            ref.read(serverInfoProvider.select((v) => v.serverFeatures.trash));
        final toDelete = ownedOnly(
          selection.value,
          errorCallback: errorBuilder('home_page_delete_err_partner'.tr()),
        ).toList();
        await ref
            .read(assetProvider.notifier)
            .deleteAssets(toDelete, force: !trashEnabled);

        final hasRemote = toDelete.any((a) => a.isRemote);
        final assetOrAssets = toDelete.length > 1 ? 'assets' : 'asset';
        final trashOrRemoved =
            !trashEnabled ? 'deleted permanently' : 'trashed';
        if (hasRemote) {
          ImmichToast.show(
            context: context,
            msg: '${selection.value.length} $assetOrAssets $trashOrRemoved',
            gravity: ToastGravity.BOTTOM,
          );
        }
        selectionEnabledHook.value = false;
      } finally {
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
        final result =
            await ref.read(albumServiceProvider).addAdditionalAssetToAlbum(
                  assets,
                  album,
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
          ref.watch(albumProvider.notifier).getAllAlbums();
          ref.watch(sharedAlbumProvider.notifier).getAllSharedAlbums();
          selectionEnabledHook.value = false;

          context.autoPush(AlbumViewerRoute(albumId: result.id));
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
        final parent = selection.value.elementAt(0);
        selection.value.remove(parent);
        await ref.read(assetStackServiceProvider).updateStack(
              parent,
              childrenToAdd: selection.value.toList(),
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

    Future<T> Function() wrapLongRunningFun<T>(Future<T> Function() fun) =>
        () async {
          processing.value = true;
          try {
            final result = await fun();
            if (result.runtimeType != bool || result == true) {
              selectionEnabledHook.value = false;
            }
            return result;
          } finally {
            processing.value = false;
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
                            : wrapLongRunningFun(onRefresh!),
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
