import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class AlbumThumbnailCard extends StatelessWidget {
  final Function()? onTap;

  const AlbumThumbnailCard({
    Key? key,
    required this.album,
    this.onTap,
  }) : super(key: key);

  final Album album;

  @override
  Widget build(BuildContext context) {
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(
      builder: (context, constraints) {
        var cardSize = constraints.maxWidth;

        buildEmptyThumbnail() {
          return Container(
            height: cardSize,
            width: cardSize,
            decoration: BoxDecoration(
              color: isDarkMode ? Colors.grey[800] : Colors.grey[200],
            ),
            child: Center(
              child: Icon(
                Icons.no_photography,
                size: cardSize * .15,
              ),
            ),
          );
        }

        buildAlbumThumbnail() => ImmichImage(
              album.thumbnail.value,
              width: cardSize,
              height: cardSize,
            );

        buildAlbumTextRow() {
          String? owner;
          if (album.ownerId == Store.get(StoreKey.userRemoteId)) {
            owner = 'Owned';
          } else if (album.ownerName != null) {
            owner = 'Shared by ${album.ownerName}';
          }

          return RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: album.assetCount == 1
                      ? 'album_thumbnail_card_item'
                        .tr(args: ['${album.assetCount}'])
                      : 'album_thumbnail_card_items'
                        .tr(args: ['${album.assetCount}']),
                  style: const TextStyle(
                    fontSize: 12,
                  ),
                ),
                if (owner != null) 
                  const TextSpan(text: ' · '),
                if (owner != null)
                  TextSpan(
                    text: owner,
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
              ],
            ),
          );
        }

        return GestureDetector(
          onTap: onTap,
          child: Flex(
            direction: Axis.vertical,
            children: [
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: cardSize,
                      height: cardSize,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: album.thumbnail.value == null
                            ? buildEmptyThumbnail()
                            : buildAlbumThumbnail(),
                      ),
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
                    buildAlbumTextRow(),         
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
