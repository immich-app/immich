import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class AlbumThumbnailListTile extends StatelessWidget {
  const AlbumThumbnailListTile({
    Key? key,
    required this.album,
    this.onTap,
  }) : super(key: key);

  final Album album;
  final void Function()? onTap;

  @override
  Widget build(BuildContext context) {
    var box = Hive.box(userInfoBox);
    var cardSize = 68.0;
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;

    buildEmptyThumbnail() {
      return Container(
        decoration: BoxDecoration(
          color: isDarkMode ? Colors.grey[800] : Colors.grey[200],
        ),
        child: SizedBox(
          height: cardSize,
          width: cardSize,
          child: const Center(
            child: Icon(Icons.no_photography),
          ),
        ),
      );
    }

    buildAlbumThumbnail() {
      return CachedNetworkImage(
        width: cardSize,
        height: cardSize,
        fit: BoxFit.cover,
        fadeInDuration: const Duration(milliseconds: 200),
        imageUrl: getAlbumThumbnailUrl(
          album,
          type: ThumbnailFormat.JPEG,
        ),
        httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
        cacheKey: getAlbumThumbNailCacheKey(album, type: ThumbnailFormat.JPEG),
        errorWidget: (context, url, error) =>
            const Icon(Icons.image_not_supported_outlined),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap ??
          () {
            AutoRouter.of(context).push(AlbumViewerRoute(albumId: album.id));
          },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: album.thumbnail.value == null
                  ? buildEmptyThumbnail()
                  : buildAlbumThumbnail(),
            ),
            Padding(
              padding: const EdgeInsets.only(
                left: 8.0,
                right: 8.0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    album.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        album.assetCount == 1
                            ? 'album_thumbnail_card_item'
                            : 'album_thumbnail_card_items',
                        style: const TextStyle(
                          fontSize: 12,
                        ),
                      ).tr(args: ['${album.assetCount}']),
                      if (album.shared)
                        const Text(
                          'album_thumbnail_card_shared',
                          style: TextStyle(
                            fontSize: 12,
                          ),
                        ).tr()
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
