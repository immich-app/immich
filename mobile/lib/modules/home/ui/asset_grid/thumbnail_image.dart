import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';

final imageFamily =
    FutureProvider.family<Widget, AssetEntity?>((ref, entity) async {
  if (entity != null) {
    final bytes =
        await entity.thumbnailDataWithSize(const ThumbnailSize.square(300));
    if (bytes != null) {
      return SizedBox(
        width: 300,
        height: 300,
        child: Image.memory(
          bytes,
          width: 300,
          height: 300,
          fit: BoxFit.cover,
        ),
      );
    }
  }
  return const SizedBox(
    width: 300,
    height: 300,
  );
  // final fb = FutureBuilder(
  //   future: entity.thumbnailDataWithSize(const ThumbnailSize(200, 200)), //resolution of thumbnail
  //   builder:
  //       (BuildContext context, AsyncSnapshot<Uint8List?> snapshot) {
  //     if (snapshot.connectionState == ConnectionState.done) {

  //       return Image.memory(
  //               snapshot.data!,
  //               fit: BoxFit.cover,
  //             );
  //     } else {
  //     return Container();
  //     }
  //   },
  // )
});

class ThumbnailImage extends HookConsumerWidget {
  final Asset asset;
  final List<Asset> assetList;
  final bool showStorageIndicator;
  final bool useGrayBoxPlaceholder;
  final bool isSelected;
  final bool multiselectEnabled;
  final Function? onSelect;
  final Function? onDeselect;

  const ThumbnailImage({
    Key? key,
    required this.asset,
    required this.assetList,
    this.showStorageIndicator = true,
    this.useGrayBoxPlaceholder = false,
    this.isSelected = false,
    this.multiselectEnabled = false,
    this.onDeselect,
    this.onSelect,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl =
        asset.isRemote ? getThumbnailUrl(asset.remote!) : '';
    var deviceId = ref.watch(authenticationProvider).deviceId;
    final AsyncValue<Widget> image = ref.watch(imageFamily(asset.local));

    Widget buildSelectionIcon(Asset asset) {
      if (isSelected) {
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
        if (multiselectEnabled) {
          if (isSelected) {
            onDeselect?.call();
          } else {
            onSelect?.call();
          }
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
        onSelect?.call();
        HapticFeedback.heavyImpact();
      },
      child: Hero(
        tag: asset.id,
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                border: multiselectEnabled && isSelected
                    ? Border.all(
                        color: Theme.of(context).primaryColorLight,
                        width: 10,
                      )
                    : const Border(),
              ),
              child: asset.isLocal
                  ? image.when(
                      data: (data) => data,
                      error: (error, stackTrace) => const SizedBox(
                        height: 300,
                        width: 300,
                      ),
                      loading: () => const SizedBox(
                        width: 300,
                        height: 300,
                      ),
                    )
                  : CachedNetworkImage(
                      cacheKey: 'thumbnail-image-${asset.id}',
                      width: 300,
                      height: 300,
                      memCacheHeight: 200,
                      maxWidthDiskCache: 200,
                      maxHeightDiskCache: 200,
                      fit: BoxFit.cover,
                      imageUrl: thumbnailRequestUrl,
                      httpHeaders: {
                        "Authorization": "Bearer ${box.get(accessTokenKey)}"
                      },
                      fadeInDuration: const Duration(milliseconds: 250),
                      progressIndicatorBuilder:
                          (context, url, downloadProgress) {
                        if (useGrayBoxPlaceholder) {
                          return const DecoratedBox(
                            decoration: BoxDecoration(color: Colors.grey),
                          );
                        }
                        return Transform.scale(
                          scale: 0.2,
                          child: CircularProgressIndicator(
                            value: downloadProgress.progress,
                          ),
                        );
                      },
                      errorWidget: (context, url, error) {
                        debugPrint("Error getting thumbnail $url = $error");
                        CachedNetworkImage.evictFromCache(thumbnailRequestUrl);

                        return Icon(
                          Icons.image_not_supported_outlined,
                          color: Theme.of(context).primaryColor,
                        );
                      },
                    ),
            ),
            if (multiselectEnabled)
              Padding(
                padding: const EdgeInsets.all(3.0),
                child: Align(
                  alignment: Alignment.topLeft,
                  child: buildSelectionIcon(asset),
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
              ),
            if (!asset.isImage)
              Positioned(
                top: 5,
                right: 5,
                child: Row(
                  children: [
                    Text(
                      asset.duration.toString().substring(0, 7),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                    const Icon(
                      Icons.play_circle_outline_rounded,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
