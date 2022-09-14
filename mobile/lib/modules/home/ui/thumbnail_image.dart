import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class ThumbnailImage extends HookConsumerWidget {
  final AssetResponseDto asset;
  final List<AssetResponseDto> assetList;
  final bool showStorageIndicator;

  const ThumbnailImage({
    Key? key,
    required this.asset,
    required this.assetList,
    this.showStorageIndicator = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl = getThumbnailUrl(asset);
    var selectedAsset = ref.watch(homePageStateProvider).selectedItems;
    var isMultiSelectEnable =
        ref.watch(homePageStateProvider).isMultiSelectEnable;
    var deviceId = ref.watch(authenticationProvider).deviceId;

    Widget _buildSelectionIcon(AssetResponseDto asset) {
      if (selectedAsset.contains(asset)) {
        return Icon(
          Icons.check_circle,
          color: Theme.of(context).primaryColor,
        );
      } else {
        return const Icon(
          Icons.circle_outlined,
          color: Colors.white,
        );
      }
    }

    return GestureDetector(
      onTap: () {
        debugPrint("View ${asset.id}");
        if (isMultiSelectEnable &&
            selectedAsset.contains(asset) &&
            selectedAsset.length == 1) {
          ref.watch(homePageStateProvider.notifier).disableMultiSelect();
        } else if (isMultiSelectEnable &&
            selectedAsset.contains(asset) &&
            selectedAsset.length > 1) {
          ref
              .watch(homePageStateProvider.notifier)
              .removeSingleSelectedItem(asset);
        } else if (isMultiSelectEnable && !selectedAsset.contains(asset)) {
          ref
              .watch(homePageStateProvider.notifier)
              .addSingleSelectedItem(asset);
        } else {
          AutoRouter.of(context).push(
            GalleryViewerRoute(
              assetList: assetList,
              asset: asset,
            ),
          );
        }
      },
      onLongPress: () {
        // Enable multi select function
        ref.watch(homePageStateProvider.notifier).enableMultiSelect({asset});
        HapticFeedback.heavyImpact();
      },
      child: Hero(
        tag: asset.id,
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                border: isMultiSelectEnable && selectedAsset.contains(asset)
                    ? Border.all(
                        color: Theme.of(context).primaryColorLight,
                        width: 10,
                      )
                    : const Border(),
              ),
              child: CachedNetworkImage(
                cacheKey: asset.id,
                width: 300,
                height: 300,
                memCacheHeight: asset.type == AssetTypeEnum.IMAGE ? 250 : 400,
                fit: BoxFit.cover,
                imageUrl: thumbnailRequestUrl,
                httpHeaders: {
                  "Authorization": "Bearer ${box.get(accessTokenKey)}"
                },
                fadeInDuration: const Duration(milliseconds: 250),
                progressIndicatorBuilder: (context, url, downloadProgress) =>
                    Transform.scale(
                  scale: 0.2,
                  child: CircularProgressIndicator(
                    value: downloadProgress.progress,
                  ),
                ),
                errorWidget: (context, url, error) {
                  // debugPrint("Error getting thumbnail $url = $error");
                  return Icon(
                    Icons.image_not_supported_outlined,
                    color: Theme.of(context).primaryColor,
                  );
                },
              ),
            ),
            if (isMultiSelectEnable)
              Padding(
                padding: const EdgeInsets.all(3.0),
                child: Align(
                  alignment: Alignment.topLeft,
                  child: _buildSelectionIcon(asset),
                ),
              ),
            if (showStorageIndicator)
              Positioned(
                right: 10,
                bottom: 5,
                child: Icon(
                  (deviceId != asset.deviceId)
                      ? Icons.cloud_done_outlined
                      : Icons.photo_library_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              )
          ],
        ),
      ),
    );
  }
}
