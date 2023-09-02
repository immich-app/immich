import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_card.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class LibraryPage extends HookConsumerWidget {
  const LibraryPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;
    var settings = ref.watch(appSettingsServiceProvider);

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    AppBar buildAppBar() {
      return AppBar(
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'IMMICH',
          style: TextStyle(
            fontFamily: 'SnowburstOne',
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
      );
    }

    final selectedAlbumSortOrder =
        useState(settings.getSetting(AppSettingsEnum.selectedAlbumSortOrder));

    List<Album> sortedAlbums() {
      if (selectedAlbumSortOrder.value == 0) {
        return albums
            .where((a) => a.isRemote)
            .sortedBy((album) => album.createdAt)
            .reversed
            .toList();
      }
      return albums.where((a) => a.isRemote).sortedBy((album) => album.name);
    }

    Widget buildSortButton() {
      final options = [
        "library_page_sort_created".tr(),
        "library_page_sort_title".tr(),
      ];

      return PopupMenuButton(
        position: PopupMenuPosition.over,
        itemBuilder: (BuildContext context) {
          return options.mapIndexed<PopupMenuEntry<int>>((index, option) {
            final selected = selectedAlbumSortOrder.value == index;
            return PopupMenuItem(
              value: index,
              child: Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: 12.0),
                    child: Icon(
                      Icons.check,
                      color: selected
                          ? Theme.of(context).primaryColor
                          : Colors.transparent,
                    ),
                  ),
                  Text(
                    option,
                    style: TextStyle(
                      color: selected ? Theme.of(context).primaryColor : null,
                      fontSize: 12.0,
                    ),
                  ),
                ],
              ),
            );
          }).toList();
        },
        onSelected: (int value) {
          selectedAlbumSortOrder.value = value;
          settings.setSetting(AppSettingsEnum.selectedAlbumSortOrder, value);
        },
        child: Row(
          children: [
            Icon(
              Icons.swap_vert_rounded,
              size: 18,
              color: Theme.of(context).primaryColor,
            ),
            Text(
              options[selectedAlbumSortOrder.value],
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).primaryColor,
                fontSize: 12.0,
              ),
            ),
          ],
        ),
      );
    }

    Widget buildCreateAlbumButton() {
      return GestureDetector(
        onTap: () {
          AutoRouter.of(context).push(CreateAlbumRoute(isSharedAlbum: false));
        },
        child: Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isDarkMode
                          ? const Color.fromARGB(255, 53, 53, 53)
                          : const Color.fromARGB(255, 203, 203, 203),
                    ),
                    color: isDarkMode ? Colors.grey[900] : Colors.grey[50],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.add_rounded,
                      size: 28,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(
                  top: 8.0,
                  bottom: 16,
                ),
                child: const Text(
                  'library_page_new_album',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ).tr(),
              ),
            ],
          ),
        ),
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
                fontWeight: FontWeight.bold,
                fontSize: 13.0,
                color: isDarkMode ? Colors.white : Colors.grey[800],
              ),
            ),
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            backgroundColor: isDarkMode ? Colors.grey[900] : Colors.grey[50],
            side: BorderSide(
              color: isDarkMode ? Colors.grey[800]! : Colors.grey[300]!,
            ),
            alignment: Alignment.centerLeft,
          ),
          icon: Icon(
            icon,
            color: Theme.of(context).primaryColor,
          ),
        ),
      );
    }

    final sorted = sortedAlbums();

    final local = albums.where((a) => a.isLocal).toList();

    return Scaffold(
      appBar: buildAppBar(),
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
                    AutoRouter.of(context).navigate(const FavoritesRoute());
                  }),
                  const SizedBox(width: 12.0),
                  buildLibraryNavButton(
                      "library_page_archive".tr(), Icons.archive_outlined, () {
                    AutoRouter.of(context).navigate(const ArchiveRoute());
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
                  const Text(
                    'library_page_albums',
                    style: TextStyle(fontWeight: FontWeight.bold),
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
                    onTap: () => AutoRouter.of(context).push(
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
                  const Text(
                    'library_page_device_albums',
                    style: TextStyle(fontWeight: FontWeight.bold),
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
                  onTap: () => AutoRouter.of(context).push(
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
