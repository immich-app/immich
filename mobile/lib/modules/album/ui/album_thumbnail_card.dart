import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/object_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class AlbumThumbnailCard extends StatelessWidget {
  final Album album;
  final Function()? onTap;
  final bool showAssetCount;
  final Icon? emptyThumbnailPlaceholder;

  /// Whether or not to show the owner of the album (or "Owned")
  /// in the subtitle of the album
  final bool showOwner;

  const AlbumThumbnailCard({
    super.key,
    required this.album,
    this.onTap,
    this.showAssetCount = true,
    this.showOwner = false,
    this.emptyThumbnailPlaceholder,
  });

  @override
  Widget build(BuildContext context) {
    var isDarkTheme = context.isDarkTheme;

    return LayoutBuilder(
      builder: (context, constraints) {
        var cardSize = constraints.maxWidth;

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
                        borderRadius:
                            const BorderRadius.all(Radius.circular(20)),
                        child: album.thumbnail == null
                            // Empty placeholder
                            ? Container(
                                height: cardSize,
                                width: cardSize,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: isDarkTheme
                                        ? const Color.fromARGB(255, 53, 53, 53)
                                        : const Color.fromARGB(
                                            255,
                                            203,
                                            203,
                                            203,
                                          ),
                                  ),
                                  color: isDarkTheme
                                      ? Colors.grey[900]
                                      : Colors.grey[50],
                                ),
                                child: Center(
                                  child: emptyThumbnailPlaceholder ??
                                      Icon(
                                        Icons.no_photography,
                                        size: cardSize * .15,
                                      ),
                                ),
                              )
                            // Thumbnail image
                            : ImmichImage(
                                album.thumbnail,
                                width: cardSize,
                                height: cardSize,
                              ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, left: 8.0),
                      child: SizedBox(
                        width: cardSize,
                        child: Text(
                          album.name,
                          overflow: TextOverflow.ellipsis,
                          style: context.textTheme.bodyMedium?.copyWith(
                            color: context.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 8.0),
                      child: _AlbumTextRow(
                        album: album,
                        showAssetCount: showAssetCount,
                        showOwner: showOwner,
                      ),
                    ),
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

class _AlbumTextRow extends StatelessWidget {
  final Album album;
  final bool showAssetCount;

  /// Whether or not to show the owner of the album (or "Owned")
  /// in the subtitle of the album
  final bool showOwner;

  const _AlbumTextRow({
    required this.album,
    required this.showAssetCount,
    required this.showOwner,
  });

  @override
  Widget build(BuildContext context) {
    String? owner;

    if (showOwner) {
      if (album.tryCast<RemoteAlbum>()?.ownerId ==
          Store.get(StoreKey.currentUser).id) {
        owner = 'album_thumbnail_owned'.tr();
      } else if (album.tryCast<RemoteAlbum>()?.ownerName != null) {
        owner = 'album_thumbnail_shared_by'
            .tr(args: [(album as RemoteAlbum).ownerName!]);
      }
    }

    return Text.rich(
      overflow: TextOverflow.fade,
      TextSpan(
        children: [
          if (showAssetCount)
            TextSpan(
              text: album.assetCount == 1
                  ? 'album_thumbnail_card_item'
                      .tr(args: ['${album.assetCount}'])
                  : 'album_thumbnail_card_items'
                      .tr(args: ['${album.assetCount}']),
              style: context.textTheme.bodyMedium,
            ),
          if (owner != null) const TextSpan(text: ' · '),
          TextSpan(
            text: owner,
            style: context.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
