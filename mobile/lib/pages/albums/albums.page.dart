import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/album_thumbnail_card.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

@RoutePage()
class AlbumsPage extends HookConsumerWidget {
  const AlbumsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums =
        ref.watch(albumProvider).where((album) => album.isRemote).toList();
    final albumSortOption = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);
    final sorted = albumSortOption.sortFn(albums, albumSortIsReverse);
    final isGrid = useState(false);
    final searchController = useTextEditingController();
    final debounceTimer = useRef<Timer?>(null);
    final filterMode = useState(QuickFilterMode.all);
    final userId = ref.watch(currentUserProvider)?.uid;
    final searchFocusNode = useFocusNode();

    toggleViewMode() {
      isGrid.value = !isGrid.value;
    }

    onSearch(String searchTerm, QuickFilterMode mode) {
      debounceTimer.value?.cancel();
      debounceTimer.value = Timer(const Duration(milliseconds: 300), () {
        ref.read(albumProvider.notifier).searchAlbums(searchTerm, mode);
      });
    }

    changeFilter(QuickFilterMode mode) {
      filterMode.value = mode;
    }

    useEffect(
      () {
        searchController.addListener(() {
          onSearch(searchController.text, filterMode.value);
        });

        return () {
          searchController.removeListener(() {
            onSearch(searchController.text, filterMode.value);
          });
          debounceTimer.value?.cancel();
        };
      },
      [],
    );

    clearSearch() {
      filterMode.value = QuickFilterMode.all;
      searchController.clear();
      onSearch('', QuickFilterMode.all);
    }

    return Scaffold(
      appBar: ImmichAppBar(
        showUploadButton: false,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.add_rounded,
              size: 28,
            ),
            onPressed: () => context.pushRoute(
              CreateAlbumRoute(),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        displacement: 70,
        onRefresh: () async {
          await ref.read(albumProvider.notifier).refreshRemoteAlbums();
        },
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12),
          children: [
            Container(
              decoration: BoxDecoration(
                border: Border.all(
                  color: context.colorScheme.onSurface.withAlpha(0),
                  width: 0,
                ),
                borderRadius: BorderRadius.circular(24),
                gradient: LinearGradient(
                  colors: [
                    context.colorScheme.primary.withValues(alpha: 0.075),
                    context.colorScheme.primary.withValues(alpha: 0.09),
                    context.colorScheme.primary.withValues(alpha: 0.075),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  transform: const GradientRotation(0.5 * pi),
                ),
              ),
              child: TextField(
                autofocus: false,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.all(16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: context.colorScheme.surfaceDim,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: context.colorScheme.surfaceContainer,
                    ),
                  ),
                  disabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: context.colorScheme.surfaceDim,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: context.colorScheme.primary.withAlpha(100),
                    ),
                  ),
                  hintText: 'search_albums'.tr(),
                  hintStyle: context.textTheme.bodyLarge?.copyWith(
                    color: context.colorScheme.onSurfaceSecondary,
                  ),
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded),
                          onPressed: clearSearch,
                        )
                      : const SizedBox.shrink(),
                ),
                controller: searchController,
                onChanged: (_) =>
                    onSearch(searchController.text, filterMode.value),
                focusNode: searchFocusNode,
                onTapOutside: (_) => searchFocusNode.unfocus(),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: [
                QuickFilterButton(
                  label: 'all'.tr(),
                  isSelected: filterMode.value == QuickFilterMode.all,
                  onTap: () {
                    changeFilter(QuickFilterMode.all);
                    onSearch(searchController.text, QuickFilterMode.all);
                  },
                ),
                QuickFilterButton(
                  label: 'shared_with_me'.tr(),
                  isSelected: filterMode.value == QuickFilterMode.sharedWithMe,
                  onTap: () {
                    changeFilter(QuickFilterMode.sharedWithMe);
                    onSearch(
                      searchController.text,
                      QuickFilterMode.sharedWithMe,
                    );
                  },
                ),
                QuickFilterButton(
                  label: 'my_albums'.tr(),
                  isSelected: filterMode.value == QuickFilterMode.myAlbums,
                  onTap: () {
                    changeFilter(QuickFilterMode.myAlbums);
                    onSearch(
                      searchController.text,
                      QuickFilterMode.myAlbums,
                    );
                  },
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
                        ? Icons.view_list_outlined
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
                      physics: const NeverScrollableScrollPhysics(),
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
                            subtitle: sorted[index].ownerId != null
                                ? Text(
                                    '${(sorted[index].assetCount == 1 ? 'album_thumbnail_card_item'.tr(
                                        args: ['${sorted[index].assetCount}'],
                                      ) : 'album_thumbnail_card_items'.tr(
                                        args: ['${sorted[index].assetCount}'],
                                      ))} • ${sorted[index].ownerId != userId ? 'album_thumbnail_shared_by'.tr(args: [sorted[index].ownerName!]) : 'album_thumbnail_owned'.tr()}',
                                    overflow: TextOverflow.ellipsis,
                                    style:
                                        context.textTheme.bodyMedium?.copyWith(
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
                              borderRadius: const BorderRadius.all(
                                Radius.circular(15),
                              ),
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
    return TextButton(
      onPressed: onTap,
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
      child: Text(
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
        elevation: const WidgetStatePropertyAll(1),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
        padding: const WidgetStatePropertyAll(
          EdgeInsets.all(4),
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
                padding: WidgetStateProperty.all(
                  const EdgeInsets.fromLTRB(16, 16, 32, 16),
                ),
                backgroundColor: WidgetStateProperty.all(
                  albumSortOption == mode
                      ? context.colorScheme.primary
                      : Colors.transparent,
                ),
                shape: WidgetStateProperty.all(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
              child: Text(
                mode.label.tr(),
                style: context.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: albumSortOption == mode
                      ? context.colorScheme.onPrimary
                      : context.colorScheme.onSurface.withAlpha(185),
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
