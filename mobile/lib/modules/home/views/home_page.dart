import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/home/providers/home_page_render_list_provider.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/home/ui/control_bottom_app_bar.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer/profile_drawer.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/shared/services/share.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:openapi/api.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);
    var renderList = ref.watch(renderListProvider);
    final multiselectEnabled = ref.watch(multiselectProvider.notifier);
    final selectionEnabledHook = useState(false);

    final selection = useState(<Asset>{});
    final albums = ref.watch(albumProvider);
    final albumService = ref.watch(albumServiceProvider);

    useEffect(
      () {
        ref.read(websocketProvider.notifier).connect();
        ref.read(assetProvider.notifier).getAllAsset();
        ref.read(albumProvider.notifier).getAllAlbums();
        ref.watch(serverInfoProvider.notifier).getServerVersion();

        selectionEnabledHook.addListener(() {
          multiselectEnabled.state = selectionEnabledHook.value;
        });

        return () {
          selectionEnabledHook.dispose();
        };
      },
      [],
    );

    void reloadAllAsset() {
      ref.read(assetProvider.notifier).getAllAsset();
    }

    Widget buildBody() {
      void selectionListener(
        bool multiselect,
        Set<Asset> selectedAssets,
      ) {
        selectionEnabledHook.value = multiselect;
        selection.value = selectedAssets;
      }

      void onShareAssets() {
        ref.watch(shareServiceProvider).shareAssets(selection.value.toList());
        selectionEnabledHook.value = false;
      }

      void onDelete() {
        ref.watch(assetProvider.notifier).deleteAssets(selection.value);
        selectionEnabledHook.value = false;
      }

      Iterable<Asset> remoteOnlySelection() {
        final Set<Asset> assets = selection.value;
        final bool onlyRemote = assets.every((e) => e.isRemote);
        if (!onlyRemote) {
          ImmichToast.show(
            context: context,
            msg: "Can not add local assets to albums yet, skipping",
            gravity: ToastGravity.BOTTOM,
          );
          return assets.where((a) => a.isRemote);
        }
        return assets;
      }

      void onAddToAlbum(AlbumResponseDto album) async {
        final Iterable<Asset> assets = remoteOnlySelection();
        if (assets.isEmpty) {
          return;
        }
        final result = await albumService.addAdditionalAssetToAlbum(
          assets,
          album.id,
        );

        if (result != null) {
          if (result.alreadyInAlbum.isNotEmpty) {
            ImmichToast.show(
              context: context,
              msg: "home_page_add_to_album_conflicts".tr(
                namedArgs: {
                  "album": album.albumName,
                  "added": result.successfullyAdded.toString(),
                  "failed": result.alreadyInAlbum.length.toString()
                },
              ),
            );
          } else {
            ImmichToast.show(
              context: context,
              msg: "home_page_add_to_album_success".tr(
                namedArgs: {
                  "album": album.albumName,
                  "added": result.successfullyAdded.toString(),
                },
              ),
              toastType: ToastType.success,
            );
          }

          selectionEnabledHook.value = false;
        }
      }

      void onCreateNewAlbum() async {
        final Iterable<Asset> assets = remoteOnlySelection();
        if (assets.isEmpty) {
          return;
        }
        final result = await albumService.createAlbumWithGeneratedName(assets);

        if (result != null) {
          ref.watch(albumProvider.notifier).getAllAlbums();
          selectionEnabledHook.value = false;

          AutoRouter.of(context).push(AlbumViewerRoute(albumId: result.id));
        }
      }

      return SafeArea(
        bottom: !multiselectEnabled.state,
        top: true,
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                if (!multiselectEnabled.state)
                  ImmichSliverAppBar(
                    onPopBack: reloadAllAsset,
                  ),
              ],
            ),
            Padding(
              padding: EdgeInsets.only(
                top: selectionEnabledHook.value ? 0 : 60,
                bottom: 0.0,
              ),
              child: ImmichAssetGrid(
                renderList: renderList,
                assetsPerRow:
                    appSettingService.getSetting(AppSettingsEnum.tilesPerRow),
                showStorageIndicator: appSettingService
                    .getSetting(AppSettingsEnum.storageIndicator),
                listener: selectionListener,
                selectionActive: selectionEnabledHook.value,
              ),
            ),
            if (selectionEnabledHook.value)
              ControlBottomAppBar(
                onShare: onShareAssets,
                onDelete: onDelete,
                onAddToAlbum: onAddToAlbum,
                albums: albums,
                onCreateNewAlbum: onCreateNewAlbum,
              ),
          ],
        ),
      );
    }

    return Scaffold(
      drawer: const ProfileDrawer(),
      body: buildBody(),
    );
  }
}
