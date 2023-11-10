import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/providers/album_detail.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_editable_title.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_appbar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';

class AlbumViewerPage extends HookConsumerWidget {
  final int albumId;

  const AlbumViewerPage({Key? key, required this.albumId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    FocusNode titleFocusNode = useFocusNode();
    final album = ref.watch(albumDetailProvider(albumId));
    final userId = ref.watch(authenticationProvider).userId;
    final selection = useState<Set<Asset>>({});
    final multiSelectEnabled = useState(false);

    useEffect(
      () {
        // Fetch album updates, e.g., cover image
        ref.invalidate(albumDetailProvider(albumId));
        return null;
      },
      [],
    );

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
          await context.autoPush<AssetSelectionPageResult?>(
        AssetSelectionRoute(
          existingAssets: albumInfo.assets,
          canDeselect: false,
          query: getRemoteAssetQuery(ref),
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
            ref.invalidate(albumDetailProvider(albumId));
          }

          ImmichLoadingOverlayController.appLoader.hide();
        }
      }
    }

    void onAddUsersPressed(Album album) async {
      List<String>? sharedUserIds = await context.autoPush<List<String>?>(
        SelectAdditionalUserForSharingRoute(album: album),
      );

      if (sharedUserIds != null) {
        ImmichLoadingOverlayController.appLoader.show();

        var isSuccess = await ref
            .watch(albumServiceProvider)
            .addAdditionalUserToAlbum(sharedUserIds, album);

        if (isSuccess) {
          ref.invalidate(albumDetailProvider(album.id));
        }

        ImmichLoadingOverlayController.appLoader.hide();
      }
    }

    Widget buildControlButton(Album album) {
      return Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 8, bottom: 16),
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
        padding: const EdgeInsets.only(left: 8, right: 8, top: 24),
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
      final DateTime? startDate = album.startDate;
      final DateTime? endDate = album.endDate;

      if (startDate == null || endDate == null) {
        return const SizedBox();
      }

      final String dateRangeText;
      if (startDate.day == endDate.day &&
          startDate.month == endDate.month &&
          startDate.year == endDate.year) {
        dateRangeText = DateFormat.yMMMd().format(startDate);
      } else {
        final String startDateText = (startDate.year == endDate.year
                ? DateFormat.MMMd()
                : DateFormat.yMMMd())
            .format(startDate);
        final String endDateText = DateFormat.yMMMd().format(endDate);
        dateRangeText = "$startDateText - $endDateText";
      }

      return Padding(
        padding: EdgeInsets.only(
          left: 16.0,
          bottom: album.shared ? 0.0 : 8.0,
        ),
        child: Text(
          dateRangeText,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    Widget buildSharedUserIconsRow(Album album) {
      return GestureDetector(
        onTap: () async {
          await context.autoPush(AlbumOptionsRoute(album: album));
          ref.invalidate(albumDetailProvider(album.id));
        },
        child: SizedBox(
          height: 50,
          child: ListView.builder(
            padding: const EdgeInsets.only(left: 16),
            scrollDirection: Axis.horizontal,
            itemBuilder: ((context, index) {
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: UserCircleAvatar(
                  user: album.sharedUsers.toList()[index],
                  radius: 18,
                  size: 36,
                  useRandomBackgroundColor: true,
                ),
              );
            }),
            itemCount: album.sharedUsers.length,
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
          if (album.shared) buildSharedUserIconsRow(album),
        ],
      );
    }

    onActivitiesPressed(Album album) {
      if (album.remoteId != null) {
        context.autoPush(
          ActivitiesRoute(
            albumId: album.remoteId!,
            appBarTitle: album.name,
            isOwner: userId == album.ownerId,
            isReadOnly: !album.activityEnabled,
          ),
        );
      }
    }

    return Scaffold(
      appBar: album.when(
        data: (data) => AlbumViewerAppbar(
          titleFocusNode: titleFocusNode,
          album: data,
          userId: userId,
          selected: selection.value,
          selectionDisabled: disableSelection,
          onAddPhotos: onAddPhotosPressed,
          onAddUsers: onAddUsersPressed,
          onActivities: onActivitiesPressed,
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
            child: ImmichAssetGrid(
              renderList: data.renderList,
              listener: selectionListener,
              selectionActive: multiSelectEnabled.value,
              showMultiSelectIndicator: false,
              topWidget: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  buildHeader(data),
                  if (data.isRemote) buildControlButton(data),
                ],
              ),
              isOwner: userId == data.ownerId,
              sharedAlbumId:
                  data.shared && data.activityEnabled ? data.remoteId : null,
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
