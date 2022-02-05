import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/routing/router.dart';

class ThumbnailImage extends HookWidget {
  final ImmichAsset asset;

  const ThumbnailImage({Key? key, required this.asset}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cacheKey = useState(1);

    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl =
        '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=true';
    return GestureDetector(
      onTap: () {
        AutoRouter.of(context).push(
          ImageViewerRoute(
            imageUrl:
                '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=false',
            heroTag: asset.id,
            thumbnailUrl: thumbnailRequestUrl,
          ),
        );
      },
      onLongPress: () {},
      child: Hero(
        tag: asset.id,
        child: CachedNetworkImage(
          cacheKey: "${asset.id}-${cacheKey.value}",
          width: 300,
          height: 300,
          memCacheHeight: 250,
          fit: BoxFit.cover,
          imageUrl: thumbnailRequestUrl,
          httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
          fadeInDuration: const Duration(milliseconds: 250),
          progressIndicatorBuilder: (context, url, downloadProgress) => Transform.scale(
            scale: 0.2,
            child: CircularProgressIndicator(value: downloadProgress.progress),
          ),
          errorWidget: (context, url, error) {
            debugPrint("Error Loading Thumbnail Widget $error");
            cacheKey.value += 1;
            return const Icon(Icons.error);
          },
        ),
      ),
    );
  }
}
