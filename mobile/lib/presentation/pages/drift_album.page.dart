import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
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
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

@RoutePage()
class DriftAlbumsPage extends HookConsumerWidget {
  const DriftAlbumsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumState = ref.watch(remoteAlbumProvider);
    final albums = albumState.filteredAlbums;
    final isLoading = albumState.isLoading;
    final error = albumState.error;
    final isGrid = useState(false);
    final searchController = useTextEditingController();
    final debounceTimer = useRef<Timer?>(null);
    final filterMode = useState(QuickFilterMode.all);
    final userId = ref.watch(currentUserProvider)?.id;
    final searchFocusNode = useFocusNode();

    Future<void> onRefresh() async {
      await ref.read(remoteAlbumProvider.notifier).refresh();
    }

    toggleViewMode() {
      isGrid.value = !isGrid.value;
    }

    onSearch(String searchTerm, QuickFilterMode mode) {
      debounceTimer.value?.cancel();
      debounceTimer.value = Timer(const Duration(milliseconds: 300), () {
        ref
            .read(remoteAlbumProvider.notifier)
            .searchAlbums(searchTerm, userId, mode);
      });
    }

    changeFilter(QuickFilterMode mode) {
      filterMode.value = mode;
    }

    useEffect(
      () {
        // Load albums when component mounts
        Future.microtask(() => ref.read(remoteAlbumProvider.notifier).getAll());

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
      ref.read(remoteAlbumProvider.notifier).clearSearch();
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: CustomScrollView(
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
                    isSelected:
                        filterMode.value == QuickFilterMode.sharedWithMe,
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
          if (isLoading)
            const SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: CircularProgressIndicator(),
                ),
              ),
            )
          else if (error != null)
            SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Text(
                    'Error loading albums: $error',
                    style: TextStyle(
                      color: context.colorScheme.error,
                    ),
                  ),
                ),
              ),
            )
          else if (albums.isEmpty)
            const SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Text('No albums found'),
                ),
              ),
            )
          else
            SliverList.builder(
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
                          'count': album.assetCount,
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
                  ),
                );
              },
              itemCount: albums.length,
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

class SortButton extends HookConsumerWidget {
  const SortButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumSortOption = useState(RemoteAlbumSortMode.lastModified);
    final albumSortIsReverse = useState(false);

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
      menuChildren: RemoteAlbumSortMode.values
          .map(
            (mode) => MenuItemButton(
              leadingIcon: albumSortOption.value == mode
                  ? albumSortIsReverse.value
                      ? Icon(
                          Icons.keyboard_arrow_down,
                          color: albumSortOption.value == mode
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        )
                      : Icon(
                          Icons.keyboard_arrow_up_rounded,
                          color: albumSortOption.value == mode
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        )
                  : const Icon(Icons.abc, color: Colors.transparent),
              onPressed: () {
                final selected = albumSortOption.value == mode;
                // Switch direction
                if (selected) {
                  albumSortIsReverse.value = !albumSortIsReverse.value;
                  ref.read(remoteAlbumProvider.notifier).sortFilteredAlbums(
                        mode,
                        isReverse: albumSortIsReverse.value,
                      );
                } else {
                  albumSortOption.value = mode;
                  ref.read(remoteAlbumProvider.notifier).sortFilteredAlbums(
                        mode,
                        isReverse: albumSortIsReverse.value,
                      );
                }
              },
              style: ButtonStyle(
                padding: WidgetStateProperty.all(
                  const EdgeInsets.fromLTRB(16, 16, 32, 16),
                ),
                backgroundColor: WidgetStateProperty.all(
                  albumSortOption.value == mode
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
                mode.label,
                style: context.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: albumSortOption.value == mode
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
                albumSortOption.value.label,
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
