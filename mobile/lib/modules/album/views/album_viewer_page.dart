import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_editable_title.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_appbar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_sliver_persistent_app_bar_delegate.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';

class AlbumViewerPage extends HookConsumerWidget {
  final int albumId;

  const AlbumViewerPage({Key? key, required this.albumId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    FocusNode titleFocusNode = useFocusNode();
    final album = ref.watch(sharedAlbumDetailProvider(albumId));
    final userId = ref.watch(authenticationProvider).userId;
    final selection = useState<Set<Asset>>({});
    final multiSelectEnabled = useState(false);
    bool? isTop;

    Future<bool> onWillPop() async {
      if (multiSelectEnabled.value) {
        selection.value = {};
        multiSelectEnabled.value = false;
        return false;
      }

      return true;
    }

    void selectionListener(bool active, Set<Asset> selected) {
      selection.value = selected;
      multiSelectEnabled.value = selected.isNotEmpty;
    }

    void disableSelection() {
      selection.value = {};
      multiSelectEnabled.value = false;
    }

    /// Find out if the assets in album exist on the device
    /// If they exist, add to selected asset state to show they are already selected.
    void onAddPhotosPressed(Album albumInfo) async {
      AssetSelectionPageResult? returnPayload =
          await AutoRouter.of(context).push<AssetSelectionPageResult?>(
        AssetSelectionRoute(
          existingAssets: albumInfo.assets,
          isNewAlbum: false,
        ),
      );

      if (returnPayload != null) {
        // Check if there is new assets add
        if (returnPayload.selectedAssets.isNotEmpty) {
          ImmichLoadingOverlayController.appLoader.show();

          var addAssetsResult =
              await ref.watch(albumServiceProvider).addAdditionalAssetToAlbum(
                    returnPayload.selectedAssets,
                    albumInfo,
                  );

          if (addAssetsResult != null &&
              addAssetsResult.successfullyAdded > 0) {
            ref.watch(albumProvider.notifier).getAllAlbums();
            ref.invalidate(sharedAlbumDetailProvider(albumId));
          }

          ImmichLoadingOverlayController.appLoader.hide();
        }
      }
    }

    void onAddUsersPressed(Album album) async {
      List<String>? sharedUserIds =
          await AutoRouter.of(context).push<List<String>?>(
        SelectAdditionalUserForSharingRoute(album: album),
      );

      if (sharedUserIds != null) {
        ImmichLoadingOverlayController.appLoader.show();

        var isSuccess = await ref
            .watch(albumServiceProvider)
            .addAdditionalUserToAlbum(sharedUserIds, album);

        if (isSuccess) {
          ref.invalidate(sharedAlbumDetailProvider(album.id));
        }

        ImmichLoadingOverlayController.appLoader.hide();
      }
    }

    Widget buildControlButton(Album album) {
      return Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 8, bottom: 8),
        child: SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              AlbumActionOutlinedButton(
                iconData: Icons.add_photo_alternate_outlined,
                onPressed: () => onAddPhotosPressed(album),
                labelText: "share_add_photos".tr(),
              ),
              if (userId == album.ownerId)
                AlbumActionOutlinedButton(
                  iconData: Icons.person_add_alt_rounded,
                  onPressed: () => onAddUsersPressed(album),
                  labelText: "album_viewer_page_share_add_users".tr(),
                ),
            ],
          ),
        ),
      );
    }

    Widget buildTitle(Album album) {
      return Padding(
        padding: const EdgeInsets.only(left: 8, right: 8, top: 16),
        child: userId == album.ownerId && album.isRemote
            ? AlbumViewerEditableTitle(
                album: album,
                titleFocusNode: titleFocusNode,
              )
            : Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  album.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
      );
    }

    Widget buildAlbumDateRange(Album album) {
      final DateTime startDate = album.assets.first.fileCreatedAt;
      final DateTime endDate = album.assets.last.fileCreatedAt; //Need default.
      final String startDateText = (startDate.year == endDate.year
              ? DateFormat.MMMd()
              : DateFormat.yMMMd())
          .format(startDate);
      final String endDateText = DateFormat.yMMMd().format(endDate);

      return Padding(
        padding: EdgeInsets.only(
          left: 16.0,
          top: 8.0,
          bottom: album.shared ? 0.0 : 8.0,
        ),
        child: Text(
          "$startDateText - $endDateText",
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
      );
    }

    Widget buildHeader(Album album) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          buildTitle(album),
          if (album.assets.isNotEmpty == true) buildAlbumDateRange(album),
          if (album.shared)
            SizedBox(
              height: 50,
              child: ListView.builder(
                padding: const EdgeInsets.only(left: 16),
                scrollDirection: Axis.horizontal,
                itemBuilder: ((context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.grey[300],
                      radius: 18,
                      child: Padding(
                        padding: const EdgeInsets.all(2.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(50.0),
                          child: Image.asset(
                            'assets/immich-logo-no-outline.png',
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                itemCount: album.sharedUsers.length,
              ),
            ),
        ],
      );
    }

    final scroll = ScrollController();

    return Scaffold(
      appBar: album.when(
        data: (data) => AlbumViewerAppbar(
          titleFocusNode: titleFocusNode,
          album: data,
          userId: userId,
          selected: selection.value,
          selectionDisabled: disableSelection,
        ),
        error: (error, stackTrace) => AppBar(title: const Text("Error")),
        loading: () => AppBar(),
      ),
      body: album.when(
        data: (data) => WillPopScope(
          onWillPop: onWillPop,
          child: GestureDetector(
            onTap: () {
              titleFocusNode.unfocus();
            },
            child: NestedScrollView(
              controller: scroll,
              floatHeaderSlivers: true,
              headerSliverBuilder: (context, innerBoxIsScrolled) => [
                SliverToBoxAdapter(child: buildHeader(data)),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: ImmichSliverPersistentAppBarDelegate(
                    minHeight: 50,
                    maxHeight: 50,
                    child: Container(
                      color: Theme.of(context).scaffoldBackgroundColor,
                      child: buildControlButton(data),
                    ),
                  ),
                )
              ],
              body: ImmichAssetGrid(
                renderList: data.renderList,
                listener: selectionListener,
                selectionActive: multiSelectEnabled.value,
                showMultiSelectIndicator: false,
                visibleItemsListener: (start, end) {
                  final top = start.index == 0 && start.itemLeadingEdge == 0.0;
                  if (top != isTop) {
                    isTop = top;
                    scroll.animateTo(
                      top
                          ? scroll.position.minScrollExtent
                          : scroll.position.maxScrollExtent,
                      duration: const Duration(milliseconds: 500),
                      curve: top ? Curves.easeOut : Curves.easeIn,
                    );
                  }
                },
              ),
            ),
          ),
        ),
        error: (e, _) => Center(child: Text("Error loading album info!\n$e")),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
