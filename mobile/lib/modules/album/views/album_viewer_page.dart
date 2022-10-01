import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_appbar.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_editable_title.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';
import 'package:openapi/api.dart';

class AlbumViewerPage extends HookConsumerWidget {
  final String albumId;

  const AlbumViewerPage({Key? key, required this.albumId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);
    FocusNode titleFocusNode = useFocusNode();
    ScrollController scrollController = useScrollController();
    var albumInfo = ref.watch(sharedAlbumDetailProvider(albumId));

    final userId = ref.watch(authenticationProvider).userId;

    /// Find out if the assets in album exist on the device
    /// If they exist, add to selected asset state to show they are already selected.
    void _onAddPhotosPressed(AlbumResponseDto albumInfo) async {
      if (albumInfo.assets.isNotEmpty == true) {
        ref
            .watch(assetSelectionProvider.notifier)
            .addNewAssets(albumInfo.assets.toList());
      }

      ref.watch(assetSelectionProvider.notifier).setIsAlbumExist(true);

      AssetSelectionPageResult? returnPayload = await AutoRouter.of(context)
          .push<AssetSelectionPageResult?>(const AssetSelectionRoute());

      if (returnPayload != null) {
        // Check if there is new assets add
        if (returnPayload.selectedAdditionalAsset.isNotEmpty) {
          ImmichLoadingOverlayController.appLoader.show();

          var isSuccess =
              await ref.watch(albumServiceProvider).addAdditionalAssetToAlbum(
                    returnPayload.selectedAdditionalAsset,
                    albumId,
                  );

          if (isSuccess) {
            ref.refresh(sharedAlbumDetailProvider(albumId));
          }

          ImmichLoadingOverlayController.appLoader.hide();
        }

        ref.watch(assetSelectionProvider.notifier).removeAll();
      } else {
        ref.watch(assetSelectionProvider.notifier).removeAll();
      }
    }

    void _onAddUsersPressed(AlbumResponseDto albumInfo) async {
      List<String>? sharedUserIds =
          await AutoRouter.of(context).push<List<String>?>(
        SelectAdditionalUserForSharingRoute(albumInfo: albumInfo),
      );

      if (sharedUserIds != null) {
        ImmichLoadingOverlayController.appLoader.show();

        var isSuccess = await ref
            .watch(albumServiceProvider)
            .addAdditionalUserToAlbum(sharedUserIds, albumId);

        if (isSuccess) {
          ref.refresh(sharedAlbumDetailProvider(albumId));
        }

        ImmichLoadingOverlayController.appLoader.hide();
      }
    }

    Widget _buildTitle(AlbumResponseDto albumInfo) {
      return Padding(
        padding: const EdgeInsets.only(left: 8, right: 8, top: 16),
        child: userId == albumInfo.ownerId
            ? AlbumViewerEditableTitle(
                albumInfo: albumInfo,
                titleFocusNode: titleFocusNode,
              )
            : Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  albumInfo.albumName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
      );
    }

    Widget _buildAlbumDateRange(AlbumResponseDto albumInfo) {
      String startDate = "";
      DateTime parsedStartDate =
          DateTime.parse(albumInfo.assets.first.createdAt);
      DateTime parsedEndDate = DateTime.parse(
        albumInfo.assets.last.createdAt,
      ); //Need default.

      if (parsedStartDate.year == parsedEndDate.year) {
        startDate = DateFormat('LLL d').format(parsedStartDate);
      } else {
        startDate = DateFormat('LLL d, y').format(parsedStartDate);
      }

      String endDate = DateFormat('LLL d, y').format(parsedEndDate);

      return Padding(
        padding: EdgeInsets.only(
          left: 16.0,
          top: 8.0,
          bottom: albumInfo.shared ? 0.0 : 8.0,
        ),
        child: Text(
          "$startDate-$endDate",
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
      );
    }

    Widget _buildHeader(AlbumResponseDto albumInfo) {
      return SliverToBoxAdapter(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTitle(albumInfo),
            if (albumInfo.assets.isNotEmpty == true)
              _buildAlbumDateRange(albumInfo),
            if (albumInfo.shared)
              SizedBox(
                height: 60,
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
                  itemCount: albumInfo.sharedUsers.length,
                ),
              )
          ],
        ),
      );
    }

    Widget _buildImageGrid(AlbumResponseDto albumInfo) {
      final assetsPerRow =
          appSettingService.getSetting(AppSettingsEnum.tilesPerRow);
      final bool showStorageIndicator =
          appSettingService.getSetting(AppSettingsEnum.storageIndicator);
      final renderList = assetsToRenderList(albumInfo.assets, assetsPerRow);

      return ImmichAssetGrid(
        assetsPerRow: assetsPerRow,
        renderList: renderList,
        showStorageIndicator: showStorageIndicator,
      );
    }

    Widget _buildControlButton(AlbumResponseDto albumInfo) {
      return Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 8, bottom: 8),
        child: SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              AlbumActionOutlinedButton(
                iconData: Icons.add_photo_alternate_outlined,
                onPressed: () => _onAddPhotosPressed(albumInfo),
                labelText: "share_add_photos".tr(),
              ),
              if (userId == albumInfo.ownerId)
                AlbumActionOutlinedButton(
                  iconData: Icons.person_add_alt_rounded,
                  onPressed: () => _onAddUsersPressed(albumInfo),
                  labelText: "album_viewer_page_share_add_users".tr(),
                ),
            ],
          ),
        ),
      );
    }

    Widget _buildBody(AlbumResponseDto albumInfo) {
      return GestureDetector(
        onTap: () {
          titleFocusNode.unfocus();
        },
        child: _buildImageGrid(albumInfo),
      );
    }

    return Scaffold(
      appBar: albumInfo.when(
        data: (AlbumResponseDto? data) {
          if (data != null) {
            return AlbumViewerAppbar(
              albumInfo: data,
              userId: userId,
              albumId: albumId,
            );
          }
          return null;
        },
        error: (e, _) => null,
        loading: () => null,
      ),
      body: albumInfo.when(
        data: (albumInfo) => albumInfo != null
            ? _buildBody(albumInfo)
            : const Center(
                child: CircularProgressIndicator(),
              ),
        error: (e, _) => Center(child: Text("Error loading album info $e")),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
