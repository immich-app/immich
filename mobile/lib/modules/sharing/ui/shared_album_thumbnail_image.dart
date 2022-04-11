import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class SharedAlbumThumbnailImage extends HookConsumerWidget {
  final ImmichAsset asset;

  const SharedAlbumThumbnailImage({Key? key, required this.asset}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cacheKey = useState(1);

    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl =
        '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=true';

    return GestureDetector(
      onTap: () {
        // debugPrint("View ${asset.id}");
      },
      child: Hero(
        tag: asset.id,
        child: Stack(
          children: [
            CachedNetworkImage(
              cacheKey: "${asset.id}-${cacheKey.value}",
              width: 500,
              height: 500,
              memCacheHeight: asset.type == 'IMAGE' ? 500 : 500,
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
          ],
        ),
      ),
    );
  }
}
