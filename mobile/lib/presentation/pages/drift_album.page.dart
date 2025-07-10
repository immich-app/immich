import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/remote_album.utils.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

@RoutePage()
class DriftAlbumsPage extends ConsumerStatefulWidget {
  const DriftAlbumsPage({super.key});

  @override
  ConsumerState<DriftAlbumsPage> createState() => _DriftAlbumsPageState();
}

class _DriftAlbumsPageState extends ConsumerState<DriftAlbumsPage> {
  bool isGrid = false;
  final searchController = TextEditingController();
  QuickFilterMode filterMode = QuickFilterMode.all;
  final searchFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();

    // Load albums when component mounts
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(remoteAlbumProvider.notifier).getAll();
    });

    searchController.addListener(() {
      onSearch(searchController.text, filterMode);
    });
  }

  void onSearch(String searchTerm, QuickFilterMode sortMode) {
    final userId = ref.watch(currentUserProvider)?.id;
    ref
        .read(remoteAlbumProvider.notifier)
        .searchAlbums(searchTerm, userId, sortMode);
  }

  Future<void> onRefresh() async {
    await ref.read(remoteAlbumProvider.notifier).refresh();
  }

  void toggleViewMode() {
    setState(() {
      isGrid = !isGrid;
    });
  }

  void changeFilter(QuickFilterMode sortMode) {
    setState(() {
      filterMode = sortMode;
    });
  }

  void clearSearch() {
    setState(() {
      filterMode = QuickFilterMode.all;
      searchController.clear();
      ref.read(remoteAlbumProvider.notifier).clearSearch();
    });
  }

  @override
  void dispose() {
    searchController.dispose();
    searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final albumState = ref.watch(remoteAlbumProvider);
    final albums = albumState.filteredAlbums;
    final isLoading = albumState.isLoading;
    final error = albumState.error;
    final userId = ref.watch(currentUserProvider)?.id;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: CustomScrollView(
        slivers: [
          ImmichSliverAppBar(
            actions: [
              IconButton(
                icon: const Icon(
                  Icons.add_rounded,
                  size: 28,
                ),
                onPressed: () => context.pushRoute(
                  const DriftCreateAlbumRoute(),
                ),
              ),
            ],
            showUploadButton: false,
          ),
          _SearchBar(
            searchController: searchController,
            searchFocusNode: searchFocusNode,
            onSearch: onSearch,
            filterMode: filterMode,
            onClearSearch: clearSearch,
          ),
          _QuickFilterButtonRow(
            filterMode: filterMode,
            onChangeFilter: changeFilter,
            onSearch: onSearch,
            searchController: searchController,
          ),
          _QuickSortAndViewMode(
            isGrid: isGrid,
            onToggleViewMode: toggleViewMode,
          ),
          isGrid
              ? _AlbumGrid(
                  albums: albums,
                  userId: userId,
                  isLoading: isLoading,
                  error: error,
                )
              : _AlbumList(
                  albums: albums,
                  userId: userId,
                  isLoading: isLoading,
                  error: error,
                ),
        ],
      ),
    );
  }
}

class _SortButton extends ConsumerStatefulWidget {
  const _SortButton();

  @override
  ConsumerState<_SortButton> createState() => _SortButtonState();
}

class _SortButtonState extends ConsumerState<_SortButton> {
  RemoteAlbumSortMode albumSortOption = RemoteAlbumSortMode.lastModified;
  bool albumSortIsReverse = true;

  void onMenuTapped(RemoteAlbumSortMode sortMode) {
    final selected = albumSortOption == sortMode;
    // Switch direction
    if (selected) {
      setState(() {
        albumSortIsReverse = !albumSortIsReverse;
      });
      ref.read(remoteAlbumProvider.notifier).sortFilteredAlbums(
            sortMode,
            isReverse: albumSortIsReverse,
          );
    } else {
      setState(() {
        albumSortOption = sortMode;
      });
      ref.read(remoteAlbumProvider.notifier).sortFilteredAlbums(
            sortMode,
            isReverse: albumSortIsReverse,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
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
            (sortMode) => MenuItemButton(
              leadingIcon: albumSortOption == sortMode
                  ? albumSortIsReverse
                      ? Icon(
                          Icons.keyboard_arrow_down,
                          color: albumSortOption == sortMode
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        )
                      : Icon(
                          Icons.keyboard_arrow_up_rounded,
                          color: albumSortOption == sortMode
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        )
                  : const Icon(Icons.abc, color: Colors.transparent),
              onPressed: () => onMenuTapped(sortMode),
              style: ButtonStyle(
                padding: WidgetStateProperty.all(
                  const EdgeInsets.fromLTRB(16, 16, 32, 16),
                ),
                backgroundColor: WidgetStateProperty.all(
                  albumSortOption == sortMode
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
                sortMode.key.t(context: context),
                style: context.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: albumSortOption == sortMode
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
                child: albumSortIsReverse
                    ? const Icon(
                        Icons.keyboard_arrow_down,
                      )
                    : const Icon(
                        Icons.keyboard_arrow_up_rounded,
                      ),
              ),
              Text(
                albumSortOption.key.t(context: context),
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

class _SearchBar extends StatelessWidget {
  const _SearchBar({
    required this.searchController,
    required this.searchFocusNode,
    required this.onSearch,
    required this.filterMode,
    required this.onClearSearch,
  });

  final TextEditingController searchController;
  final FocusNode searchFocusNode;
  final void Function(String, QuickFilterMode) onSearch;
  final QuickFilterMode filterMode;
  final VoidCallback onClearSearch;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
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
                    onPressed: onClearSearch,
                  )
                : null,
            controller: searchController,
            onChanged: (_) => onSearch(searchController.text, filterMode),
            focusNode: searchFocusNode,
            onTapOutside: (_) => searchFocusNode.unfocus(),
          ),
        ),
      ),
    );
  }
}

class _QuickFilterButtonRow extends StatelessWidget {
  const _QuickFilterButtonRow({
    required this.filterMode,
    required this.onChangeFilter,
    required this.onSearch,
    required this.searchController,
  });

  final QuickFilterMode filterMode;
  final void Function(QuickFilterMode) onChangeFilter;
  final void Function(String, QuickFilterMode) onSearch;
  final TextEditingController searchController;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Wrap(
          spacing: 4,
          runSpacing: 4,
          children: [
            _QuickFilterButton(
              label: 'all'.tr(),
              isSelected: filterMode == QuickFilterMode.all,
              onTap: () {
                onChangeFilter(QuickFilterMode.all);
                onSearch(searchController.text, QuickFilterMode.all);
              },
            ),
            _QuickFilterButton(
              label: 'shared_with_me'.tr(),
              isSelected: filterMode == QuickFilterMode.sharedWithMe,
              onTap: () {
                onChangeFilter(QuickFilterMode.sharedWithMe);
                onSearch(
                  searchController.text,
                  QuickFilterMode.sharedWithMe,
                );
              },
            ),
            _QuickFilterButton(
              label: 'my_albums'.tr(),
              isSelected: filterMode == QuickFilterMode.myAlbums,
              onTap: () {
                onChangeFilter(QuickFilterMode.myAlbums);
                onSearch(
                  searchController.text,
                  QuickFilterMode.myAlbums,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickFilterButton extends StatelessWidget {
  const _QuickFilterButton({
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

class _QuickSortAndViewMode extends StatelessWidget {
  const _QuickSortAndViewMode({
    required this.isGrid,
    required this.onToggleViewMode,
  });

  final bool isGrid;
  final VoidCallback onToggleViewMode;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const _SortButton(),
            IconButton(
              icon: Icon(
                isGrid ? Icons.view_list_outlined : Icons.grid_view_outlined,
                size: 24,
              ),
              onPressed: onToggleViewMode,
            ),
          ],
        ),
      ),
    );
  }
}

class _AlbumList extends StatelessWidget {
  const _AlbumList({
    required this.isLoading,
    required this.error,
    required this.albums,
    required this.userId,
  });

  final bool isLoading;
  final String? error;
  final List<RemoteAlbum> albums;
  final String? userId;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    if (error != null) {
      return SliverToBoxAdapter(
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
      );
    }

    if (albums.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: Text('No albums found'),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      sliver: SliverList.builder(
        itemBuilder: (_, index) {
          final album = albums[index];

          return Padding(
            padding: const EdgeInsets.only(
              bottom: 8.0,
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
                      'user': album.ownerName,
                    },
                  ) : 'owned'.t(context: context)}',
                overflow: TextOverflow.ellipsis,
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.colorScheme.onSurfaceSecondary,
                ),
              ),
              onTap: () => context.router.push(
                RemoteAlbumRoute(album: album),
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
                  : SizedBox(
                      width: 80,
                      height: 80,
                      child: Container(
                        decoration: BoxDecoration(
                          color: context.colorScheme.surfaceContainer,
                          borderRadius:
                              const BorderRadius.all(Radius.circular(16)),
                          border: Border.all(
                            color: context.colorScheme.outline.withAlpha(50),
                            width: 1,
                          ),
                        ),
                        child: const Icon(
                          Icons.photo_album_rounded,
                          size: 24,
                          color: Colors.grey,
                        ),
                      ),
                    ),
            ),
          );
        },
        itemCount: albums.length,
      ),
    );
  }
}

class _AlbumGrid extends StatelessWidget {
  const _AlbumGrid({
    required this.albums,
    required this.userId,
    required this.isLoading,
    required this.error,
  });

  final List<RemoteAlbum> albums;
  final String? userId;
  final bool isLoading;
  final String? error;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    if (error != null) {
      return SliverToBoxAdapter(
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
      );
    }

    if (albums.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: Text('No albums found'),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 250,
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          childAspectRatio: .7,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final album = albums[index];
            return _GridAlbumCard(
              album: album,
              userId: userId,
            );
          },
          childCount: albums.length,
        ),
      ),
    );
  }
}

class _GridAlbumCard extends StatelessWidget {
  const _GridAlbumCard({
    required this.album,
    required this.userId,
  });

  final RemoteAlbum album;
  final String? userId;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.router.push(
        RemoteAlbumRoute(album: album),
      ),
      child: Card(
        elevation: 0,
        color: context.colorScheme.surfaceBright,
        shape: RoundedRectangleBorder(
          borderRadius: const BorderRadius.all(
            Radius.circular(16),
          ),
          side: BorderSide(
            color: context.colorScheme.onSurface.withAlpha(25),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 2,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(15),
                ),
                child: SizedBox(
                  width: double.infinity,
                  child: album.thumbnailAssetId != null
                      ? Thumbnail(
                          remoteId: album.thumbnailAssetId,
                        )
                      : Container(
                          color: context.colorScheme.surfaceContainerHighest,
                          child: const Icon(
                            Icons.photo_album_rounded,
                            size: 40,
                            color: Colors.grey,
                          ),
                        ),
                ),
              ),
            ),
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Text(
                      album.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${'items_count'.t(
                        context: context,
                        args: {
                          'count': album.assetCount,
                        },
                      )} • ${album.ownerId != userId ? 'shared_by_user'.t(
                          context: context,
                          args: {
                            'user': album.ownerName,
                          },
                        ) : 'owned'.t(context: context)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.labelMedium?.copyWith(
                        color: context.colorScheme.onSurfaceSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
