import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class SharedAlbumThumbnailImage extends HookConsumerWidget {
  final AssetResponseDto asset;

  const SharedAlbumThumbnailImage({Key? key, required this.asset})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);

    return GestureDetector(
      onTap: () {
        // debugPrint("View ${asset.id}");
      },
      child: Stack(
        children: [
          CachedNetworkImage(
            cacheKey: asset.id,
            width: 500,
            height: 500,
            memCacheHeight: 500,
            fit: BoxFit.cover,
            imageUrl: getThumbnailUrl(asset),
            httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
            fadeInDuration: const Duration(milliseconds: 250),
            progressIndicatorBuilder: (context, url, downloadProgress) =>
                Transform.scale(
              scale: 0.2,
              child:
                  CircularProgressIndicator(value: downloadProgress.progress),
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
    );
  }
}
