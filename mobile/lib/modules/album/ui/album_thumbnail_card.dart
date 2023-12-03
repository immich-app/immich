import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class AlbumThumbnailCard extends StatelessWidget {
  final Function()? onTap;

  /// Whether or not to show the owner of the album (or "Owned")
  /// in the subtitle of the album
  final bool showOwner;

  const AlbumThumbnailCard({
    Key? key,
    required this.album,
    this.onTap,
    this.showOwner = false,
  }) : super(key: key);

  final Album album;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        var cardSize = constraints.maxWidth;

        buildEmptyThumbnail() {
          return SizedBox(
            height: cardSize,
            width: cardSize,
            child: Card(
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(20.0)),
              ),
              child: Center(
                child: Icon(
                  Icons.no_photography,
                  size: cardSize * .15,
                ),
              ),
            ),
          );
        }

        buildAlbumThumbnail() => Card(
              clipBehavior: Clip.hardEdge,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(20)),
              ),
              child: ImmichImage(
                album.thumbnail.value,
                width: cardSize,
                height: cardSize,
              ),
            );

        buildAlbumTextRow() {
          // Add the owner name to the subtitle
          String? owner;
          if (showOwner) {
            if (album.ownerId == Store.get(StoreKey.currentUser).id) {
              owner = 'album_thumbnail_owned'.tr();
            } else if (album.ownerName != null) {
              owner = 'album_thumbnail_shared_by'.tr(args: [album.ownerName!]);
            }
          }

          return Text.rich(
            overflow: TextOverflow.fade,
            TextSpan(
              children: [
                TextSpan(
                  text: album.assetCount == 1
                      ? 'album_thumbnail_card_item'
                          .tr(args: ['${album.assetCount}'])
                      : 'album_thumbnail_card_items'
                          .tr(args: ['${album.assetCount}']),
                  style: context.textTheme.bodyMedium,
                ),
                if (owner != null) const TextSpan(text: ' · '),
                if (owner != null)
                  TextSpan(
                    text: owner,
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: context.colorScheme.onSurface,
                    ),
                  ),
              ],
            ),
          );
        }

        return GestureDetector(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: cardSize,
                height: cardSize,
                child: ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(20)),
                  child: album.thumbnail.value == null
                      ? buildEmptyThumbnail()
                      : buildAlbumThumbnail(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 8.0, left: 8.0),
                child: SizedBox(
                  width: cardSize,
                  child: Text(
                    album.name,
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: context.primaryColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 2.0, left: 8.0),
                child: buildAlbumTextRow(),
              ),
            ],
          ),
        );
      },
    );
  }
}
