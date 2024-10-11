import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:immich_mobile/widgets/album/album_action_filled_button.dart';
import 'package:immich_mobile/widgets/album/album_viewer_editable_title.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
import 'package:immich_mobile/widgets/album/album_viewer_appbar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class AlbumViewerPage extends HookConsumerWidget {
  final int albumId;

  const AlbumViewerPage({super.key, required this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    FocusNode titleFocusNode = useFocusNode();
    final album = ref.watch(albumWatcher(albumId));
    // Listen provider to prevent autoDispose when navigating to other routes from within the viewer page
    ref.listen(currentAlbumProvider, (_, __) {});
    album.whenData(
      (value) => Future.microtask(
        () => ref.read(currentAlbumProvider.notifier).set(value),
      ),
    );
    final userId = ref.watch(authenticationProvider).userId;
    final isProcessing = useProcessingOverlay();

    Future<bool> onRemoveFromAlbumPressed(Iterable<Asset> assets) async {
      final a = album.valueOrNull;
      final bool isSuccess = a != null &&
          await ref.read(albumProvider.notifier).removeAsset(a, assets);

      if (!isSuccess) {
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_remove".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }
      return isSuccess;
    }

    /// Find out if the assets in album exist on the device
    /// If they exist, add to selected asset state to show they are already selected.
    void onAddPhotosPressed(Album albumInfo) async {
      AssetSelectionPageResult? returnPayload =
          await context.pushRoute<AssetSelectionPageResult?>(
        AlbumAssetSelectionRoute(
          existingAssets: albumInfo.assets,
          canDeselect: false,
          query: getRemoteAssetQuery(ref),
        ),
      );

      if (returnPayload != null && returnPayload.selectedAssets.isNotEmpty) {
        // Check if there is new assets add
        isProcessing.value = true;

        await ref.watch(albumProvider.notifier).addAssets(
              albumInfo,
              returnPayload.selectedAssets,
            );

        isProcessing.value = false;
      }
    }

    void onAddUsersPressed(Album album) async {
      List<String>? sharedUserIds = await context.pushRoute<List<String>?>(
        AlbumAdditionalSharedUserSelectionRoute(album: album),
      );

      if (sharedUserIds != null) {
        isProcessing.value = true;

        await ref.watch(albumProvider.notifier).addUsers(album, sharedUserIds);

        isProcessing.value = false;
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
              AlbumActionFilledButton(
                iconData: Icons.add_photo_alternate_outlined,
                onPressed: () => onAddPhotosPressed(album),
                labelText: "share_add_photos".tr(),
              ),
              if (userId == album.ownerId)
                AlbumActionFilledButton(
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
        padding: const EdgeInsets.only(left: 8, right: 8),
        child: userId == album.ownerId && album.isRemote
            ? AlbumViewerEditableTitle(
                album: album,
                titleFocusNode: titleFocusNode,
              )
            : Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  album.name,
                  style: context.textTheme.headlineMedium,
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
          style: context.textTheme.labelLarge,
        ),
      );
    }

    Widget buildSharedUserIconsRow(Album album) {
      return album.sharedUsers.isNotEmpty
          ? GestureDetector(
              onTap: () => context.pushRoute(AlbumOptionsRoute(album: album)),
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
                      ),
                    );
                  }),
                  itemCount: album.sharedUsers.length,
                ),
              ),
            )
          : const SizedBox.shrink();
    }

    Widget buildHeader(Album album) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          buildTitle(album),
          if (album.assets.isNotEmpty == true) buildAlbumDateRange(album),
          buildSharedUserIconsRow(album),
        ],
      );
    }

    onActivitiesPressed(Album album) {
      if (album.remoteId != null) {
        context.pushRoute(
          const ActivitiesRoute(),
        );
      }
    }

    return Scaffold(
      body: Stack(
        children: [
          album.widgetWhen(
            onData: (albumInfo) => MultiselectGrid(
              renderListProvider: albumRenderlistProvider(albumId),
              topWidget: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  buildHeader(albumInfo),
                  if (albumInfo.isRemote) buildControlButton(albumInfo),
                ],
              ),
              onRemoveFromAlbum: onRemoveFromAlbumPressed,
              editEnabled: albumInfo.ownerId == userId,
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            top: ref.watch(multiselectProvider)
                ? -(kToolbarHeight + MediaQuery.of(context).padding.top)
                : 0,
            left: 0,
            right: 0,
            child: album.when(
              data: (data) => AlbumViewerAppbar(
                titleFocusNode: titleFocusNode,
                album: data,
                userId: userId,
                onAddPhotos: onAddPhotosPressed,
                onAddUsers: onAddUsersPressed,
                onActivities: onActivitiesPressed,
              ),
              error: (error, stackTrace) => AppBar(title: const Text("Error")),
              loading: () => AppBar(),
            ),
          ),
        ],
      ),
    );
  }
}
