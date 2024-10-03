import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/providers/album/albumv2.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/album_thumbnail_card.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

enum QuickFilterMode {
  all,
  sharedWithMe,
  myAlbums,
}

@RoutePage()
class AlbumsCollectionPage extends HookConsumerWidget {
  const AlbumsCollectionPage({super.key, this.showImmichAppbar = false});

  final bool showImmichAppbar;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums =
        ref.watch(albumProviderV2).where((album) => album.isRemote).toList();
    final albumSortOption = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);
    final sorted = albumSortOption.sortFn(albums, albumSortIsReverse);
    final isGrid = useState(false);
    final searchController = useTextEditingController();
    final debounceTimer = useRef<Timer?>(null);
    final filterMode = useState(QuickFilterMode.all);
    final userId = ref.watch(currentUserProvider)?.id;

    toggleViewMode() {
      isGrid.value = !isGrid.value;
    }

    onSearch(String value) {
      debounceTimer.value?.cancel();
      debounceTimer.value = Timer(const Duration(milliseconds: 300), () {
        filterMode.value = QuickFilterMode.all;
        ref.read(albumProviderV2.notifier).searchAlbums(value);
      });
    }

    changeFilter(QuickFilterMode mode) {
      filterMode.value = mode;
      ref.read(albumProviderV2.notifier).filterAlbums(mode);
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
        title: showImmichAppbar
            ? null
            : Text(
                "${'albums'.tr()} ${albums.length}",
              ),
        bottom: showImmichAppbar
            ? const PreferredSize(
                preferredSize: Size.fromHeight(0),
                child: ImmichAppBar(),
              )
            : null,
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
            hintText: "search_albums".tr(),
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
                  width: 0.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: [
              QuickFilterButton(
                label: 'All',
                isSelected: filterMode.value == QuickFilterMode.all,
                onTap: () => changeFilter(QuickFilterMode.all),
              ),
              QuickFilterButton(
                label: 'Shared with me',
                isSelected: filterMode.value == QuickFilterMode.sharedWithMe,
                onTap: () => changeFilter(QuickFilterMode.sharedWithMe),
              ),
              QuickFilterButton(
                label: 'My albums',
                isSelected: filterMode.value == QuickFilterMode.myAlbums,
                onTap: () => changeFilter(QuickFilterMode.myAlbums),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SortButton(),
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
          const SizedBox(height: 5),
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
                        showOwner: true,
                      );
                    },
                    itemCount: sorted.length,
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const ClampingScrollPhysics(),
                    itemCount: sorted.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: LargeLeadingTile(
                          title: Text(
                            sorted[index].name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: context.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          subtitle: sorted[index].ownerId == userId
                              ? Text(
                                  '${sorted[index].assetCount} items',
                                  overflow: TextOverflow.ellipsis,
                                  style: context.textTheme.bodyMedium?.copyWith(
                                    color:
                                        context.colorScheme.onSurfaceSecondary,
                                  ),
                                )
                              : sorted[index].ownerName != null
                                  ? Text(
                                      '${sorted[index].assetCount} items • ${'album_thumbnail_shared_by'.tr(
                                        args: [
                                          sorted[index].ownerName!,
                                        ],
                                      )}',
                                      overflow: TextOverflow.ellipsis,
                                      style: context.textTheme.bodyMedium
                                          ?.copyWith(
                                        color: context
                                            .colorScheme.onSurfaceSecondary,
                                      ),
                                    )
                                  : null,
                          onTap: () => context.pushRoute(
                            AlbumViewerRoute(albumId: sorted[index].id),
                          ),
                          leadingPadding: const EdgeInsets.only(
                            right: 16,
                          ),
                          leading: ClipRRect(
                            borderRadius:
                                const BorderRadius.all(Radius.circular(15)),
                            child: ImmichThumbnail(
                              asset: sorted[index].thumbnail.value,
                              width: 80,
                              height: 80,
                            ),
                          ),
                          // minVerticalPadding: 1,
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

class QuickFilterButton extends StatelessWidget {
  const QuickFilterButton({
    super.key,
    required this.isSelected,
    required this.onTap,
    required this.label,
  });

  final bool isSelected;
  final VoidCallback onTap;
  final String label;

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onTap,
      icon: isSelected
          ? Icon(
              Icons.check_rounded,
              color: context.colorScheme.onPrimary,
              size: 18,
            )
          : const SizedBox.shrink(),
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.all(
          isSelected ? context.colorScheme.primary : Colors.transparent,
        ),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: context.colorScheme.onSurface.withAlpha(25),
              width: 1,
            ),
          ),
        ),
      ),
      label: Text(
        label,
        style: TextStyle(
          color: isSelected
              ? context.colorScheme.onPrimary
              : context.colorScheme.onSurface,
          fontSize: 14,
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
                    color: context.colorScheme.onSurface.withAlpha(225),
                  ),
                ),
              ),
              Text(
                albumSortOption.label.tr(),
                style: context.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: context.colorScheme.onSurface.withAlpha(225),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
