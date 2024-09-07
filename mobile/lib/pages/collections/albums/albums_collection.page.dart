import 'dart:async';
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
    final isGrid = useState(true);
    final searchController = useTextEditingController();
    final debounceTimer = useRef<Timer?>(null);

    useEffect(
      () {
        Future.delayed(const Duration(seconds: 1), () {
          ref.read(albumProvider.notifier).getAllAlbums();
        });
        return null;
      },
      [],
    );

    toggleViewMode() {
      isGrid.value = !isGrid.value;
    }

    onSearch(String value) {
      debounceTimer.value?.cancel();
      debounceTimer.value = Timer(const Duration(milliseconds: 300), () {
        ref.read(albumProvider.notifier).searchAlbums(value);
      });
    }

    useEffect(
      () {
        searchController.addListener(() {
          onSearch(searchController.text);
        });
        return () {
          searchController.removeListener(() {
            onSearch(searchController.text);
          });
          debounceTimer.value?.cancel();
        };
      },
      [],
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text("Albums"),
      ),
      body: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(18.0),
        children: [
          SearchBar(
            backgroundColor: WidgetStatePropertyAll(
              context.colorScheme.surfaceContainer,
            ),
            autoFocus: false,
            hintText: "Search albums",
            onChanged: onSearch,
            elevation: const WidgetStatePropertyAll(0.25),
            controller: searchController,
            leading: const Icon(Icons.search_rounded),
            padding: WidgetStateProperty.all(
              const EdgeInsets.symmetric(horizontal: 16),
            ),
            shape: WidgetStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: context.colorScheme.onSurface.withAlpha(10),
                  width: 1,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SortButton(),
              const SizedBox(width: 10),
              IconButton(
                icon: Icon(
                  isGrid.value
                      ? Icons.view_list_rounded
                      : Icons.grid_view_outlined,
                  size: 24,
                ),
                onPressed: toggleViewMode,
              ),
            ],
          ),
          const SizedBox(height: 16),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: isGrid.value
                ? GridView.builder(
                    shrinkWrap: true,
                    physics: const ClampingScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
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
                : ListView.builder(
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
      style: MenuStyle(
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      consumeOutsideTap: true,
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
                shape: WidgetStateProperty.all(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
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
