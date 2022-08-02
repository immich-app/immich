import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:openapi/api.dart';
import 'package:transparent_image/transparent_image.dart';

class AlbumThumbnailCard extends StatelessWidget {
  const AlbumThumbnailCard({Key? key, required this.album}) : super(key: key);

  final AlbumResponseDto album;

  @override
  Widget build(BuildContext context) {
    var box = Hive.box(userInfoBox);

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
              child: FadeInImage(
                width: MediaQuery.of(context).size.width / 2 - 18,
                height: MediaQuery.of(context).size.width / 2 - 18,
                fit: BoxFit.cover,
                placeholder: MemoryImage(kTransparentImage),
                image: NetworkImage(
                  '${box.get(serverEndpointKey)}/asset/thumbnail/${album.albumThumbnailAssetId}?format=JPEG',
                  headers: {
                    "Authorization": "Bearer ${box.get(accessTokenKey)}"
                  },
                ),
                fadeInDuration: const Duration(milliseconds: 200),
                fadeOutDuration: const Duration(milliseconds: 200),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Text(
                album.albumName,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${album.assets.length} item${album.assets.length > 1 ? 's' : ''}',
                  style: const TextStyle(
                    fontSize: 10,
                  ),
                ),
                if (album.shared)
                  const Text(
                    ' · Shared',
                    style: TextStyle(
                      fontSize: 10,
                    ),
                  )
              ],
            )
          ],
        ),
      ),
    );
  }
}
