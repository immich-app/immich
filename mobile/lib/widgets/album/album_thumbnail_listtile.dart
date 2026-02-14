import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class AlbumThumbnailListTile extends StatelessWidget {
  const AlbumThumbnailListTile({super.key, required this.album, this.onTap});

  final Album album;
  final void Function()? onTap;

  @override
  Widget build(BuildContext context) {
    var cardSize = 68.0;

    buildEmptyThumbnail() {
      return Container(
        decoration: BoxDecoration(color: context.isDarkTheme ? Colors.grey[800] : Colors.grey[200]),
        child: SizedBox(
          height: cardSize,
          width: cardSize,
          child: const Center(child: Icon(Icons.no_photography)),
        ),
      );
    }

    buildAlbumThumbnail() {
      return SizedBox(
        width: cardSize,
        height: cardSize,
        child: Thumbnail(
          imageProvider: RemoteImageProvider(url: getAlbumThumbnailUrl(album, type: AssetMediaSize.thumbnail)),
        ),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap:
          onTap ??
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
              child: album.thumbnail.value == null ? buildEmptyThumbnail() : buildAlbumThumbnail(),
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
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'items_count'.t(context: context, args: {'count': album.assetCount}),
                          style: const TextStyle(fontSize: 12),
                        ),
                        if (album.shared) ...[
                          const Text(' • ', style: TextStyle(fontSize: 12)),
                          Text('shared'.tr(), style: const TextStyle(fontSize: 12)),
                        ],
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
