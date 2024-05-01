import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album_sort_by_options.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_listtile.dart';
import 'package:immich_mobile/entities/album.entity.dart';

class AddToAlbumSliverList extends HookConsumerWidget {
  /// The asset to add to an album
  final List<Album> albums;
  final List<Album> sharedAlbums;
  final void Function(Album) onAddToAlbum;
  final bool enabled;

  const AddToAlbumSliverList({
    super.key,
    required this.onAddToAlbum,
    required this.albums,
    required this.sharedAlbums,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumSortMode = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);
    final sortedAlbums = albumSortMode.sortFn(albums, albumSortIsReverse);
    final sortedSharedAlbums =
        albumSortMode.sortFn(sharedAlbums, albumSortIsReverse);

    return SliverList(
      delegate: SliverChildBuilderDelegate(
          childCount: albums.length + (sharedAlbums.isEmpty ? 0 : 1),
          (context, index) {
        // Build shared expander
        if (index == 0 && sortedSharedAlbums.isNotEmpty) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ExpansionTile(
              title: Text('common_shared'.tr()),
              tilePadding: const EdgeInsets.symmetric(horizontal: 10.0),
              leading: const Icon(Icons.group),
              children: [
                ListView.builder(
                  shrinkWrap: true,
                  physics: const ClampingScrollPhysics(),
                  itemCount: sortedSharedAlbums.length,
                  itemBuilder: (context, index) => AlbumThumbnailListTile(
                    album: sortedSharedAlbums[index],
                    onTap: enabled
                        ? () => onAddToAlbum(sortedSharedAlbums[index])
                        : () {},
                  ),
                ),
              ],
            ),
          );
        }

        // Build albums list
        final offset = index - (sharedAlbums.isNotEmpty ? 1 : 0);
        final album = sortedAlbums[offset];
        return AlbumThumbnailListTile(
          album: album,
          onTap: enabled ? () => onAddToAlbum(album) : () {},
        );
      }),
    );
  }
}
