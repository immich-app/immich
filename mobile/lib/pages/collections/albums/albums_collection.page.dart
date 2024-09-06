import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/album_thumbnail_card.dart';

@RoutePage()
class AlbumsCollectionPage extends HookConsumerWidget {
  const AlbumsCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);
    final albumSortOption = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);
    final remote = albums.where((a) => a.isRemote).toList();
    final sorted = albumSortOption.sortFn(remote, albumSortIsReverse);
    final local = albums.where((a) => a.isLocal).toList();

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text("Albums"),
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.only(
                  top: 12.0,
                  left: 12.0,
                  right: 12.0,
                  bottom: 20.0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SortButton(),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(12.0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 250,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: .7,
                ),
                delegate: SliverChildBuilderDelegate(
                  childCount: sorted.length,
                  (context, index) {
                    return AlbumThumbnailCard(
                      album: sorted[index],
                      onTap: () => context.pushRoute(
                        AlbumViewerRoute(
                          albumId: sorted[index].id,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(
                  top: 12.0,
                  left: 12.0,
                  right: 12.0,
                  bottom: 20.0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'library_page_device_albums',
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ).tr(),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(12.0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 250,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: .7,
                ),
                delegate: SliverChildBuilderDelegate(
                  childCount: local.length,
                  (context, index) => AlbumThumbnailCard(
                    album: local[index],
                    onTap: () => context.pushRoute(
                      AlbumViewerRoute(
                        albumId: local[index].id,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SortButton extends ConsumerWidget {
  const SortButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumSortOption = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);

    return PopupMenuButton(
      position: PopupMenuPosition.over,
      itemBuilder: (BuildContext context) {
        return AlbumSortMode.values
            .map<PopupMenuEntry<AlbumSortMode>>((option) {
          final selected = albumSortOption == option;
          return PopupMenuItem(
            value: option,
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 12.0),
                  child: Icon(
                    Icons.check,
                    color: selected ? context.primaryColor : Colors.transparent,
                  ),
                ),
                Text(
                  option.label.tr(),
                  style: TextStyle(
                    color: selected ? context.primaryColor : null,
                    fontSize: 14.0,
                  ),
                ),
              ],
            ),
          );
        }).toList();
      },
      onSelected: (AlbumSortMode value) {
        final selected = albumSortOption == value;
        // Switch direction
        if (selected) {
          ref
              .read(albumSortOrderProvider.notifier)
              .changeSortDirection(!albumSortIsReverse);
        } else {
          ref.read(albumSortByOptionsProvider.notifier).changeSortMode(value);
        }
      },
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 5),
            child: Icon(
              albumSortIsReverse
                  ? Icons.arrow_downward_rounded
                  : Icons.arrow_upward_rounded,
              size: 18,
            ),
          ),
          Text(
            albumSortOption.label.tr(),
            style: context.textTheme.labelLarge?.copyWith(),
          ),
        ],
      ),
    );
  }
}
