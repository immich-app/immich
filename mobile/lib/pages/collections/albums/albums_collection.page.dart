import 'dart:math';

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
        padding: const EdgeInsets.all(18.0),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SortButton(),
              const SizedBox(width: 10),
              IconButton(
                icon: Icon(
                  isGrid.value ? Icons.list_rounded : Icons.grid_view_outlined,
                ),
                onPressed: toggleViewMode,
              ),
            ],
          ),
          if (isGrid.value)
            GridView.builder(
              shrinkWrap: true,
              physics: const ClampingScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 250,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: .7,
              ),
              itemBuilder: (context, index) {
                return AlbumThumbnailCard(
                  album: sorted[index],
                  onTap: () => context.pushRoute(
                    AlbumViewerRoute(albumId: sorted[index].id),
                  ),
                );
              },
              itemCount: sorted.length,
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const ClampingScrollPhysics(),
              itemCount: sorted.length,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text(sorted[index].name),
                  onTap: () => context.pushRoute(
                    AlbumViewerRoute(albumId: sorted[index].id),
                  ),
                );
              },
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

    return MenuAnchor(
      menuChildren: AlbumSortMode.values
          .map(
            (mode) => MenuItemButton(
              leadingIcon: albumSortOption == mode
                  ? albumSortIsReverse
                      ? Icon(
                          Icons.keyboard_arrow_down,
                          color: albumSortOption == mode
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        )
                      : Icon(
                          Icons.keyboard_arrow_up_rounded,
                          color: albumSortOption == mode
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        )
                  : const Icon(Icons.abc, color: Colors.transparent),
              onPressed: () {
                final selected = albumSortOption == mode;
                // Switch direction
                if (selected) {
                  ref
                      .read(albumSortOrderProvider.notifier)
                      .changeSortDirection(!albumSortIsReverse);
                } else {
                  ref
                      .read(albumSortByOptionsProvider.notifier)
                      .changeSortMode(mode);
                }
              },
              style: ButtonStyle(
                padding: WidgetStateProperty.all(const EdgeInsets.all(8)),
                backgroundColor: WidgetStateProperty.all(
                  albumSortOption == mode
                      ? context.colorScheme.primary
                      : Colors.transparent,
                ),
              ),
              child: Text(
                mode.label.tr(),
                style: context.textTheme.bodyMedium?.copyWith(
                  color: albumSortOption == mode
                      ? context.colorScheme.onPrimary
                      : context.colorScheme.onSurface,
                ),
              ),
            ),
          )
          .toList(),
      builder: (context, controller, child) {
        return GestureDetector(
          onTap: () {
            if (controller.isOpen) {
              controller.close();
            } else {
              controller.open();
            }
          },
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 5),
                child: Transform.rotate(
                  angle: 90 * pi / 180,
                  child: Icon(
                    Icons.compare_arrows_rounded,
                    size: 18,
                    color: context.colorScheme.onSurface.withAlpha(200),
                  ),
                ),
              ),
              Text(
                albumSortOption.label.tr(),
                style: context.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: context.colorScheme.onSurface.withAlpha(200),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
