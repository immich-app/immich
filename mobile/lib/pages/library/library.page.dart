import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/widgets/album/album_thumbnail_card.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';

@RoutePage()
class LibraryPage extends HookConsumerWidget {
  const LibraryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    final albums = ref.watch(albumProvider);
    final isDarkTheme = context.isDarkTheme;
    final albumSortOption = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    Widget buildSortButton() {
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
                      color:
                          selected ? context.primaryColor : Colors.transparent,
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
                size: 14,
                color: context.primaryColor,
              ),
            ),
            Text(
              albumSortOption.label.tr(),
              style: context.textTheme.labelLarge?.copyWith(
                color: context.primaryColor,
              ),
            ),
          ],
        ),
      );
    }

    Widget buildCreateAlbumButton() {
      return LayoutBuilder(
        builder: (context, constraints) {
          var cardSize = constraints.maxWidth;

          return GestureDetector(
            onTap: () =>
                context.pushRoute(CreateAlbumRoute(isSharedAlbum: false)),
            child: Padding(
              padding:
                  const EdgeInsets.only(bottom: 32), // Adjust padding to suit
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: cardSize,
                    height: cardSize,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isDarkTheme
                            ? const Color.fromARGB(255, 53, 53, 53)
                            : const Color.fromARGB(255, 203, 203, 203),
                      ),
                      color: isDarkTheme ? Colors.grey[900] : Colors.grey[50],
                      borderRadius: const BorderRadius.all(Radius.circular(20)),
                    ),
                    child: Center(
                      child: Icon(
                        Icons.add_rounded,
                        size: 28,
                        color: context.primaryColor,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(
                      top: 8.0,
                      bottom: 16,
                    ),
                    child: Text(
                      'library_page_new_album',
                      style: context.textTheme.labelLarge,
                    ).tr(),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }

    Widget buildLibraryNavButton(
      String label,
      IconData icon,
      Function() onClick,
    ) {
      return Expanded(
        child: OutlinedButton.icon(
          onPressed: onClick,
          label: Padding(
            padding: const EdgeInsets.only(left: 8.0),
            child: Text(
              label,
              style: TextStyle(
                color: context.isDarkTheme
                    ? Colors.white
                    : Colors.black.withAlpha(200),
              ),
            ),
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            backgroundColor: isDarkTheme ? Colors.grey[900] : Colors.grey[50],
            side: BorderSide(
              color: isDarkTheme ? Colors.grey[800]! : Colors.grey[300]!,
            ),
            alignment: Alignment.centerLeft,
          ),
          icon: Icon(
            icon,
            color: context.primaryColor,
          ),
        ),
      );
    }

    final remote = albums.where((a) => a.isRemote).toList();
    final sorted = albumSortOption.sortFn(remote, albumSortIsReverse);
    final local = albums.where((a) => a.isLocal).toList();

    Widget? shareTrashButton() {
      return trashEnabled
          ? InkWell(
              onTap: () => context.pushRoute(const TrashRoute()),
              borderRadius: const BorderRadius.all(Radius.circular(12)),
              child: Icon(
                Icons.delete_rounded,
                size: 25,
                semanticLabel: 'profile_drawer_trash'.tr(),
              ),
            )
          : null;
    }

    return Scaffold(
      appBar: ImmichAppBar(
        action: shareTrashButton(),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(
                left: 12.0,
                right: 12.0,
                top: 24.0,
                bottom: 12.0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  buildLibraryNavButton(
                      "library_page_favorites".tr(), Icons.favorite_border, () {
                    context.navigateTo(const FavoritesRoute());
                  }),
                  const SizedBox(width: 12.0),
                  buildLibraryNavButton(
                      "library_page_archive".tr(), Icons.archive_outlined, () {
                    context.navigateTo(const ArchiveRoute());
                  }),
                ],
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
                    'library_page_albums',
                    style: context.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ).tr(),
                  buildSortButton(),
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
                childCount: sorted.length + 1,
                (context, index) {
                  if (index == 0) {
                    return buildCreateAlbumButton();
                  }

                  return AlbumThumbnailCard(
                    album: sorted[index - 1],
                    onTap: () => context.pushRoute(
                      AlbumViewerRoute(
                        albumId: sorted[index - 1].id,
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
    );
  }
}
