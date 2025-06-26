import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

@RoutePage()
class DriftAlbumsPage extends HookConsumerWidget {
  const DriftAlbumsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumsFuture = ref.watch(remoteAlbumRepository).getAll();
    final isGrid = useState(false);
    final searchController = useTextEditingController();
    final debounceTimer = useRef<Timer?>(null);
    final filterMode = useState(QuickFilterMode.all);
    final userId = ref.watch(currentUserProvider)?.id;
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

    return CustomScrollView(
      slivers: [
        const ImmichSliverAppBar(),

        /// Search Bar
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          sliver: SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(
                  color: context.colorScheme.onSurface.withAlpha(0),
                  width: 0,
                ),
                borderRadius: const BorderRadius.all(
                  Radius.circular(24),
                ),
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
              child: SearchField(
                autofocus: false,
                contentPadding: const EdgeInsets.all(16),
                hintText: 'search_albums'.tr(),
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: clearSearch,
                      )
                    : null,
                controller: searchController,
                onChanged: (_) =>
                    onSearch(searchController.text, filterMode.value),
                focusNode: searchFocusNode,
                onTapOutside: (_) => searchFocusNode.unfocus(),
              ),
            ),
          ),
        ),

        /// Quick Filter Buttons
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverToBoxAdapter(
            child: Wrap(
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
          ),
        ),

        /// Quick Sort and View Mode
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverToBoxAdapter(
            child: Row(
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
          ),
        ),

        /// Albums Lists
        SliverList.builder(
          itemBuilder: (context, index) {
            return null;
          },
        ),

        FutureBuilder(
          future: albumsFuture,
          builder: (_, snap) {
            final albums = snap.data ?? [];
            if (albums.isEmpty) {
              return const SliverToBoxAdapter(child: SizedBox.shrink());
            }

            albums.sortBy((a) => a.name);
            return SliverList.builder(
              itemBuilder: (_, index) {
                final album = albums[index];

                return Padding(
                  padding: const EdgeInsets.only(
                    left: 16.0,
                    bottom: 8.0,
                    right: 16.0,
                  ),
                  child: LargeLeadingTile(
                    title: Text(
                      album.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      '${'items_count'.t(
                        context: context,
                        args: {
                          'count': 0,
                        },
                      )} • ${album.ownerId != userId ? 'shared_by_user'.t(
                          context: context,
                          args: {
                            'user': album.ownerId,
                          },
                        ) : 'owned'.t(context: context)}',
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.bodyMedium?.copyWith(
                        color: context.colorScheme.onSurfaceSecondary,
                      ),
                    ),
                    onTap: () => context.router.push(
                      RemoteTimelineRoute(albumId: album.id),
                    ),
                    leadingPadding: const EdgeInsets.only(
                      right: 16,
                    ),
                    leading: album.thumbnailAssetId != null
                        ? ClipRRect(
                            borderRadius: const BorderRadius.all(
                              Radius.circular(15),
                            ),
                            child: SizedBox(
                              width: 80,
                              height: 80,
                              child: Thumbnail(
                                remoteId: album.thumbnailAssetId,
                              ),
                            ),
                          )
                        : const SizedBox(
                            width: 80,
                            height: 80,
                            child: Icon(
                              Icons.photo_album_rounded,
                              size: 40,
                              color: Colors.grey,
                            ),
                          ),
                    // minVerticalPadding: 1,
                  ),
                );
              },
              itemCount: albums.length,
            );
          },
        ),
      ],
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
            borderRadius: const BorderRadius.all(
              Radius.circular(20),
            ),
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
          const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(
              Radius.circular(24),
            ),
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
                  const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(
                      Radius.circular(24),
                    ),
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
