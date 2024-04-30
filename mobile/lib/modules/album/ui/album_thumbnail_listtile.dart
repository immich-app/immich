import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class AlbumThumbnailListTile extends StatelessWidget {
  const AlbumThumbnailListTile({
    super.key,
    required this.album,
    this.onTap,
  });

  final Album album;
  final void Function()? onTap;

  @override
  Widget build(BuildContext context) {
    var cardSize = 68.0;

    buildEmptyThumbnail() {
      return Container(
        decoration: BoxDecoration(
          color: context.isDarkTheme ? Colors.grey[800] : Colors.grey[200],
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
          type: ThumbnailFormat.WEBP,
        ),
        httpHeaders: {
          "x-immich-user-token": Store.get(StoreKey.accessToken),
        },
        cacheKey: getAlbumThumbNailCacheKey(album, type: ThumbnailFormat.WEBP),
        errorWidget: (context, url, error) =>
            const Icon(Icons.image_not_supported_outlined),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap ??
          () {
            context.pushRoute(AlbumViewerRoute(albumId: album.id));
          },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(8)),
              child: album.thumbnail.value == null
                  ? buildEmptyThumbnail()
                  : buildAlbumThumbnail(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      album.name,
                      overflow: TextOverflow.ellipsis,
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
                          ).tr(),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
