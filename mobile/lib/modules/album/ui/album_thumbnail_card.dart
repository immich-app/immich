import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class AlbumThumbnailCard extends StatelessWidget {
  const AlbumThumbnailCard({
    Key? key,
    required this.album,
  }) : super(key: key);

  final AlbumResponseDto album;

  @override
  Widget build(BuildContext context) {
    var box = Hive.box(userInfoBox);

    final cardSize = MediaQuery.of(context).size.width / 2 - 18;

    return GestureDetector(
      onTap: () {
        AutoRouter.of(context).push(AlbumViewerRoute(albumId: album.id));
      },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                memCacheHeight: max(400, cardSize.toInt() * 3),
                width: cardSize,
                height: cardSize,
                fit: BoxFit.cover,
                fadeInDuration: const Duration(milliseconds: 200),
                imageUrl:
                    getAlbumThumbnailUrl(album, type: ThumbnailFormat.JPEG),
                httpHeaders: {
                  "Authorization": "Bearer ${box.get(accessTokenKey)}"
                },
                cacheKey: "${album.albumThumbnailAssetId}",
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: SizedBox(
                width: cardSize,
                child: Text(
                  album.albumName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
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
    );
  }
}
