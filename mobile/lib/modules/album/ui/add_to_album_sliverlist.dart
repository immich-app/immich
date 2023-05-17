import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_listtile.dart';
import 'package:immich_mobile/shared/models/album.dart';

class AddToAlbumSliverList extends HookConsumerWidget {
  /// The asset to add to an album
  final List<Album> albums;
  final List<Album> sharedAlbums;
  final void Function(Album) onAddToAlbum;
  final bool enabled;

  const AddToAlbumSliverList({
    Key? key,
    required this.onAddToAlbum,
    required this.albums,
    required this.sharedAlbums,
    this.enabled = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
          childCount: albums.length + (sharedAlbums.isEmpty ? 0 : 1),
          (context, index) {
        // Build shared expander
        if (index == 0 && sharedAlbums.isNotEmpty) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ExpansionTile(
              title: Text('common_shared'.tr()),
              tilePadding: const EdgeInsets.symmetric(horizontal: 10.0),
              leading: const Icon(Icons.group),
              children: sharedAlbums
                  .map(
                    (album) => AlbumThumbnailListTile(
                      album: album,
                      onTap: enabled ? () => onAddToAlbum(album) : () {},
                    ),
                  )
                  .toList(),
            ),
          );
        }

        // Build albums list
        final offset = index - (sharedAlbums.isNotEmpty ? 1 : 0);
        final album = albums[offset];
        return AlbumThumbnailListTile(
          album: album,
          onTap: enabled ? () => onAddToAlbum(album) : () {},
        );
      }),
    );
  }
}
