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
    final isGrid = useState(false);

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    toggleViewMode() {
      isGrid.value = !isGrid.value;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Albums"),
      ),
      body: ListView(
        shrinkWrap: true,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SortButton(),
              IconButton(
                onPressed: toggleViewMode,
                icon: Icon(isGrid.value ? Icons.list : Icons.grid_view),
              ),
            ],
          ),
          GridView.count(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 32,
            crossAxisSpacing: 32,
            children: sorted.map((album) {
              return AlbumThumbnailCard(
                album: album,
                onTap: () =>
                    context.pushRoute(AlbumViewerRoute(albumId: album.id)),
              );
            }).toList(),
          ),
        ],
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
