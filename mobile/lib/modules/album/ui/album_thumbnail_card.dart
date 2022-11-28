import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class AlbumThumbnailCard extends StatelessWidget {
  const AlbumThumbnailCard({
    Key? key,
    required this.album,
  }) : super(key: key);

  final Album album;

  @override
  Widget build(BuildContext context) {
    var cardSize = MediaQuery.of(context).size.width / 2 - 18;
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
      return ImmichImage(
        album.albumThumbnailAsset.value!,
        width: cardSize,
        height: cardSize,
      );
    }

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
              child: album.albumThumbnailAsset.value == null
                  ? buildEmptyThumbnail()
                  : buildAlbumThumbnail(),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: SizedBox(
                width: cardSize,
                child: Text(
                  album.name,
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
