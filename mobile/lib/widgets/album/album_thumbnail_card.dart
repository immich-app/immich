import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

class AlbumThumbnailCard extends StatelessWidget {
  final Function()? onTap;

  /// Whether or not to show the owner of the album (or "Owned")
  /// in the subtitle of the album
  final bool showOwner;
  final bool showTitle;

  const AlbumThumbnailCard({
    super.key,
    required this.album,
    this.onTap,
    this.showOwner = false,
    this.showTitle = true,
  });

  final Album album;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        var cardSize = constraints.maxWidth;

        buildEmptyThumbnail() {
          return Container(
            height: cardSize,
            width: cardSize,
            decoration: BoxDecoration(
              color: context.colorScheme.surfaceContainerHigh,
            ),
            child: Center(
              child: Icon(
                Icons.no_photography,
                size: cardSize * .15,
                color: context.colorScheme.primary,
              ),
            ),
          );
        }

        buildAlbumThumbnail() => ImmichThumbnail(
              asset: album.thumbnail.value,
              width: cardSize,
              height: cardSize,
            );

        buildAlbumTextRow() {
          // Add the owner name to the subtitle
          String? owner;
          if (showOwner) {
            if (album.ownerId == Store.get(StoreKey.currentUser).uid) {
              owner = 'album_thumbnail_owned'.tr();
            } else if (album.ownerName != null) {
              owner = 'album_thumbnail_shared_by'.tr(args: [album.ownerName!]);
            }
          }

          return RichText(
            overflow: TextOverflow.fade,
            text: TextSpan(
              style: context.textTheme.bodyMedium?.copyWith(
                color: context.colorScheme.onSurfaceSecondary,
              ),
              children: [
                TextSpan(
                  text: album.assetCount == 1
                      ? 'album_thumbnail_card_item'
                          .tr(args: ['${album.assetCount}'])
                      : 'album_thumbnail_card_items'
                          .tr(args: ['${album.assetCount}']),
                ),
                if (owner != null) const TextSpan(text: ' • '),
                if (owner != null) TextSpan(text: owner),
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
                    if (showTitle) ...[
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: SizedBox(
                          width: cardSize,
                          child: Text(
                            album.name,
                            overflow: TextOverflow.ellipsis,
                            style: context.textTheme.titleSmall?.copyWith(
                              color: context.colorScheme.onSurface,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                      buildAlbumTextRow(),
                    ],
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
