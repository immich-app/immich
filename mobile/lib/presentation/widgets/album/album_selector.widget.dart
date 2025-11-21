import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/presentation/widgets/album/album_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/album_filter.utils.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:sliver_tools/sliver_tools.dart';

typedef AlbumSelectorCallback = void Function(RemoteAlbum album);

class AlbumSelector extends ConsumerStatefulWidget {
  final AlbumSelectorCallback onAlbumSelected;
  final Function? onKeyboardExpanded;

  const AlbumSelector({super.key, required this.onAlbumSelected, this.onKeyboardExpanded});

  @override
  ConsumerState<AlbumSelector> createState() => _AlbumSelectorState();
}

class _AlbumSelectorState extends ConsumerState<AlbumSelector> {
  bool isGrid = false;
  final searchController = TextEditingController();
  final menuController = MenuController();
  final searchFocusNode = FocusNode();
  List<RemoteAlbum> sortedAlbums = [];
  List<RemoteAlbum> shownAlbums = [];

  AlbumFilter filter = AlbumFilter(query: "", mode: QuickFilterMode.all);
  AlbumSort sort = AlbumSort(mode: AlbumSortMode.lastModified, isReverse: true);

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appSettings = ref.read(appSettingsServiceProvider);
      final savedSortMode = appSettings.getSetting(AppSettingsEnum.selectedAlbumSortOrder);
      final savedIsReverse = appSettings.getSetting(AppSettingsEnum.selectedAlbumSortReverse);
      final savedIsGrid = appSettings.getSetting(AppSettingsEnum.albumGridView);

      final albumSortMode = AlbumSortMode.values.firstWhere(
        (e) => e.storeIndex == savedSortMode,
        orElse: () => AlbumSortMode.lastModified,
      );

      setState(() {
        sort = AlbumSort(mode: albumSortMode, isReverse: savedIsReverse);
        isGrid = savedIsGrid;
      });

      ref.read(remoteAlbumProvider.notifier).refresh();
    });

    searchController.addListener(() {
      onSearch(searchController.text, filter.mode);
    });

    searchFocusNode.addListener(() {
      if (searchFocusNode.hasFocus) {
        widget.onKeyboardExpanded?.call();
      }
    });
  }

  void onSearch(String searchTerm, QuickFilterMode filterMode) {
    final userId = ref.watch(currentUserProvider)?.id;
    filter = filter.copyWith(query: searchTerm, userId: userId, mode: filterMode);

    filterAlbums();
  }

  Future<void> onRefresh() async {
    await ref.read(remoteAlbumProvider.notifier).refresh();
  }

  void toggleViewMode() {
    setState(() {
      isGrid = !isGrid;
    });
    ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.albumGridView, isGrid);
  }

  void changeFilter(QuickFilterMode mode) {
    setState(() {
      filter = filter.copyWith(mode: mode);
    });

    filterAlbums();
  }

  Future<void> changeSort(AlbumSort sort) async {
    setState(() {
      this.sort = sort;
    });

    final appSettings = ref.read(appSettingsServiceProvider);
    await appSettings.setSetting(AppSettingsEnum.selectedAlbumSortOrder, sort.mode.storeIndex);
    await appSettings.setSetting(AppSettingsEnum.selectedAlbumSortReverse, sort.isReverse);

    await sortAlbums();
  }

  void clearSearch() {
    setState(() {
      filter = filter.copyWith(mode: QuickFilterMode.all, query: null);
      searchController.clear();
    });

    filterAlbums();
  }

  Future<void> sortAlbums() async {
    final sorted = await ref
        .read(remoteAlbumProvider.notifier)
        .sortAlbums(ref.read(remoteAlbumProvider).albums, sort.mode, isReverse: sort.isReverse);

    setState(() {
      sortedAlbums = sorted;
    });

    // we need to re-filter the albums after sorting
    // so shownAlbums gets updated
    unawaited(filterAlbums());
  }

  Future<void> filterAlbums() async {
    if (filter.query == null) {
      setState(() {
        shownAlbums = sortedAlbums;
      });

      return;
    }

    final filteredAlbums = ref
        .read(remoteAlbumProvider.notifier)
        .searchAlbums(sortedAlbums, filter.query!, filter.userId, filter.mode);

    setState(() {
      shownAlbums = filteredAlbums;
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
    final userId = ref.watch(currentUserProvider)?.id;

    // refilter and sort when albums change
    ref.listen(remoteAlbumProvider.select((state) => state.albums), (_, _) async {
      await sortAlbums();
    });

    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        menuController.close();
      },
      child: MultiSliver(
        children: [
          _SearchBar(
            searchController: searchController,
            searchFocusNode: searchFocusNode,
            onSearch: onSearch,
            filterMode: filter.mode,
            onClearSearch: clearSearch,
          ),
          _QuickFilterButtonRow(
            filterMode: filter.mode,
            onChangeFilter: changeFilter,
            onSearch: onSearch,
            searchController: searchController,
          ),
          _QuickSortAndViewMode(
            isGrid: isGrid,
            onToggleViewMode: toggleViewMode,
            onSortChanged: changeSort,
            controller: menuController,
            currentSortMode: sort.mode,
            currentIsReverse: sort.isReverse,
          ),
          isGrid
              ? _AlbumGrid(albums: shownAlbums, userId: userId, onAlbumSelected: widget.onAlbumSelected)
              : _AlbumList(albums: shownAlbums, userId: userId, onAlbumSelected: widget.onAlbumSelected),
        ],
      ),
    );
  }
}

class _SortButton extends ConsumerStatefulWidget {
  const _SortButton(
    this.onSortChanged, {
    required this.initialSortMode,
    required this.initialIsReverse,
    this.controller,
  });

  final Future<void> Function(AlbumSort) onSortChanged;
  final MenuController? controller;
  final AlbumSortMode initialSortMode;
  final bool initialIsReverse;

  @override
  ConsumerState<_SortButton> createState() => _SortButtonState();
}

class _SortButtonState extends ConsumerState<_SortButton> {
  late AlbumSortMode albumSortOption;
  late bool albumSortIsReverse;
  bool isSorting = false;

  @override
  void initState() {
    super.initState();
    albumSortOption = widget.initialSortMode;
    albumSortIsReverse = widget.initialIsReverse;
  }

  @override
  void didUpdateWidget(_SortButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialSortMode != widget.initialSortMode || oldWidget.initialIsReverse != widget.initialIsReverse) {
      setState(() {
        albumSortOption = widget.initialSortMode;
        albumSortIsReverse = widget.initialIsReverse;
      });
    }
  }

  Future<void> onMenuTapped(AlbumSortMode sortMode) async {
    final selected = albumSortOption == sortMode;
    // Switch direction
    if (selected) {
      setState(() {
        albumSortIsReverse = !albumSortIsReverse;
        isSorting = true;
      });
    } else {
      setState(() {
        albumSortOption = sortMode;
        isSorting = true;
      });
    }

    await widget.onSortChanged.call(AlbumSort(mode: albumSortOption, isReverse: albumSortIsReverse));

    setState(() {
      isSorting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MenuAnchor(
      controller: widget.controller,
      style: MenuStyle(
        elevation: const WidgetStatePropertyAll(1),
        shape: WidgetStateProperty.all(
          const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.all(4)),
      ),
      consumeOutsideTap: true,
      menuChildren: AlbumSortMode.values
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
                padding: WidgetStateProperty.all(const EdgeInsets.fromLTRB(16, 16, 32, 16)),
                backgroundColor: WidgetStateProperty.all(
                  albumSortOption == sortMode ? context.colorScheme.primary : Colors.transparent,
                ),
                shape: WidgetStateProperty.all(
                  const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
                ),
              ),
              child: Text(
                sortMode.label.t(context: context),
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
                    ? const Icon(Icons.keyboard_arrow_down)
                    : const Icon(Icons.keyboard_arrow_up_rounded),
              ),
              Text(
                albumSortOption.label.t(context: context),
                style: context.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: context.colorScheme.onSurface.withAlpha(225),
                ),
              ),
              isSorting
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: context.colorScheme.onSurface.withAlpha(225),
                      ),
                    )
                  : const SizedBox.shrink(),
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
            border: Border.all(color: context.colorScheme.onSurface.withAlpha(0), width: 0),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
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
                ? IconButton(icon: const Icon(Icons.clear_rounded), onPressed: onClearSearch)
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
                onSearch(searchController.text, QuickFilterMode.sharedWithMe);
              },
            ),
            _QuickFilterButton(
              label: 'my_albums'.tr(),
              isSelected: filterMode == QuickFilterMode.myAlbums,
              onTap: () {
                onChangeFilter(QuickFilterMode.myAlbums);
                onSearch(searchController.text, QuickFilterMode.myAlbums);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickFilterButton extends StatelessWidget {
  const _QuickFilterButton({required this.isSelected, required this.onTap, required this.label});

  final bool isSelected;
  final VoidCallback onTap;
  final String label;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.all(isSelected ? context.colorScheme.primary : Colors.transparent),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(
            borderRadius: const BorderRadius.all(Radius.circular(20)),
            side: BorderSide(color: context.colorScheme.onSurface.withAlpha(25), width: 1),
          ),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? context.colorScheme.onPrimary : context.colorScheme.onSurface,
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
    required this.onSortChanged,
    required this.currentSortMode,
    required this.currentIsReverse,
    this.controller,
  });

  final bool isGrid;
  final VoidCallback onToggleViewMode;
  final MenuController? controller;
  final Future<void> Function(AlbumSort) onSortChanged;
  final AlbumSortMode currentSortMode;
  final bool currentIsReverse;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _SortButton(
              onSortChanged,
              controller: controller,
              initialSortMode: currentSortMode,
              initialIsReverse: currentIsReverse,
            ),
            IconButton(
              icon: Icon(isGrid ? Icons.view_list_outlined : Icons.grid_view_outlined, size: 24),
              onPressed: onToggleViewMode,
            ),
          ],
        ),
      ),
    );
  }
}

class _AlbumList extends ConsumerWidget {
  const _AlbumList({required this.albums, required this.userId, required this.onAlbumSelected});

  final List<RemoteAlbum> albums;
  final String? userId;
  final AlbumSelectorCallback onAlbumSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (albums.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(padding: const EdgeInsets.all(20.0), child: Text('album_search_not_found'.tr())),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.only(left: 16.0, right: 16, bottom: 64),
      sliver: SliverList.builder(
        itemBuilder: (_, index) {
          final album = albums[index];
          final isOwner = album.ownerId == userId;

          if (isOwner) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Dismissible(
                key: ValueKey(album.id),
                background: Container(
                  color: context.colorScheme.error,
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 16),
                  child: Icon(Icons.delete, color: context.colorScheme.onError),
                ),
                direction: DismissDirection.endToStart,
                confirmDismiss: (direction) {
                  return showDialog<bool>(
                    context: context,
                    builder: (context) => ConfirmDialog(
                      onOk: () => true,
                      title: "delete_album".t(context: context),
                      content: "album_delete_confirmation".t(context: context, args: {'album': album.name}),
                      ok: "delete".t(context: context),
                    ),
                  );
                },
                onDismissed: (direction) async {
                  await ref.read(remoteAlbumProvider.notifier).deleteAlbum(album.id);
                },
                child: AlbumTile(album: album, isOwner: isOwner, onAlbumSelected: onAlbumSelected),
              ),
            );
          } else {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: AlbumTile(album: album, isOwner: isOwner, onAlbumSelected: onAlbumSelected),
            );
          }
        },
        itemCount: albums.length,
      ),
    );
  }
}

class _AlbumGrid extends StatelessWidget {
  const _AlbumGrid({required this.albums, required this.userId, required this.onAlbumSelected});

  final List<RemoteAlbum> albums;
  final String? userId;
  final AlbumSelectorCallback onAlbumSelected;

  @override
  Widget build(BuildContext context) {
    if (albums.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(padding: const EdgeInsets.all(20.0), child: Text('album_search_not_found'.tr())),
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
        delegate: SliverChildBuilderDelegate((context, index) {
          final album = albums[index];
          return _GridAlbumCard(album: album, userId: userId, onAlbumSelected: onAlbumSelected);
        }, childCount: albums.length),
      ),
    );
  }
}

class _GridAlbumCard extends ConsumerWidget {
  const _GridAlbumCard({required this.album, required this.userId, required this.onAlbumSelected});

  final RemoteAlbum album;
  final String? userId;
  final AlbumSelectorCallback onAlbumSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => onAlbumSelected(album),
      child: Card(
        elevation: 0,
        color: context.colorScheme.surfaceBright,
        shape: RoundedRectangleBorder(
          borderRadius: const BorderRadius.all(Radius.circular(16)),
          side: BorderSide(color: context.colorScheme.onSurface.withAlpha(25), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 2,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                child: SizedBox(
                  width: double.infinity,
                  child: album.thumbnailAssetId != null
                      ? Thumbnail.remote(remoteId: album.thumbnailAssetId!)
                      : Container(
                          color: context.colorScheme.surfaceContainerHighest,
                          child: const Icon(Icons.photo_album_rounded, size: 40, color: Colors.grey),
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
                      style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '${'items_count'.t(context: context, args: {'count': album.assetCount})} • ${album.ownerId != userId ? 'shared_by_user'.t(context: context, args: {'user': album.ownerName}) : 'owned'.t(context: context)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.labelMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
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

class AddToAlbumHeader extends ConsumerWidget {
  const AddToAlbumHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> onCreateAlbum() async {
      final newAlbum = await ref
          .read(remoteAlbumProvider.notifier)
          .createAlbum(
            title: "Untitled Album",
            assetIds: ref.read(multiSelectProvider).selectedAssets.map((e) => (e as RemoteAsset).id).toList(),
          );

      if (newAlbum == null) {
        ImmichToast.show(context: context, toastType: ToastType.error, msg: 'errors.failed_to_create_album'.tr());
        return;
      }

      ref.read(multiSelectProvider.notifier).reset();
      unawaited(context.pushRoute(RemoteAlbumRoute(album: newAlbum)));
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("add_to_album", style: context.textTheme.titleSmall).tr(),
            TextButton.icon(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), // remove internal padding
                minimumSize: const Size(0, 0), // allow shrinking
                tapTargetSize: MaterialTapTargetSize.shrinkWrap, // remove extra height
              ),
              onPressed: onCreateAlbum,
              icon: Icon(Icons.add, color: context.primaryColor),
              label: Text(
                "common_create_new_album",
                style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
              ).tr(),
            ),
          ],
        ),
      ),
    );
  }
}
