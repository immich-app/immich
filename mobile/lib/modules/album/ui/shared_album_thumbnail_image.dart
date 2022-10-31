import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class SharedAlbumThumbnailImage extends HookConsumerWidget {
  final Asset asset;

  const SharedAlbumThumbnailImage({Key? key, required this.asset})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    final AsyncValue<Widget> image = ref.watch(imageFamily(asset.local));

    return GestureDetector(
      onTap: () {
        // debugPrint("View ${asset.id}");
      },
      child: Stack(
        children: [
          asset.isLocal
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
                  cacheKey: asset.id,
                  width: 500,
                  height: 500,
                  memCacheHeight: 500,
                  fit: BoxFit.cover,
                  imageUrl: getThumbnailUrl(asset.remote!),
                  httpHeaders: {
                    "Authorization": "Bearer ${box.get(accessTokenKey)}"
                  },
                  fadeInDuration: const Duration(milliseconds: 250),
                  progressIndicatorBuilder: (context, url, downloadProgress) =>
                      Transform.scale(
                    scale: 0.2,
                    child: CircularProgressIndicator(
                        value: downloadProgress.progress),
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
