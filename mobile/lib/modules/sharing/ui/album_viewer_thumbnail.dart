import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/sharing/providers/asset_selection.provider.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/routing/router.dart';

class AlbumViewerThumbnail extends HookConsumerWidget {
  final ImmichAsset asset;

  const AlbumViewerThumbnail({Key? key, required this.asset}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cacheKey = useState(1);
    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl =
        '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=true';
    var deviceId = ref.watch(authenticationProvider).deviceId;

    _viewAsset() {
      if (asset.type == 'IMAGE') {
        AutoRouter.of(context).push(
          ImageViewerRoute(
            imageUrl:
                '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=false',
            heroTag: asset.id,
            thumbnailUrl: thumbnailRequestUrl,
            asset: asset,
          ),
        );
      } else {
        AutoRouter.of(context).push(
          VideoViewerRoute(
              videoUrl: '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}',
              asset: asset),
        );
      }
    }

    _enableMultiselect() {
      ref.watch(assetSelectionProvider.notifier);
    }

    return GestureDetector(
      onTap: _viewAsset,
      onLongPress: _enableMultiselect,
      child: Hero(
        tag: asset.id,
        child: Stack(
          children: [
            CachedNetworkImage(
              cacheKey: "${asset.id}-${cacheKey.value}",
              width: 300,
              height: 300,
              memCacheHeight: 200,
              fit: BoxFit.cover,
              imageUrl: thumbnailRequestUrl,
              httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
              fadeInDuration: const Duration(milliseconds: 250),
              progressIndicatorBuilder: (context, url, downloadProgress) => Transform.scale(
                scale: 0.2,
                child: CircularProgressIndicator(value: downloadProgress.progress),
              ),
              errorWidget: (context, url, error) {
                return Icon(
                  Icons.image_not_supported_outlined,
                  color: Theme.of(context).primaryColor,
                );
              },
            ),
            Positioned(
              right: 10,
              bottom: 5,
              child: Icon(
                (deviceId != asset.deviceId) ? Icons.cloud_done_outlined : Icons.photo_library_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            asset.type == 'IMAGE'
                ? Container()
                : Positioned(
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
                  )
          ],
        ),
      ),
    );
  }
}
