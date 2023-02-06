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

class LibraryPage extends HookConsumerWidget {
  const LibraryPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);

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

    final selectedAlbumSortOrder = useState(0);

    List<Album> sortedAlbums() {
      if (selectedAlbumSortOrder.value == 0) {
        return albums.sortedBy((album) => album.createdAt).reversed.toList();
      }
      return albums.sortedBy((album) => album.name);
    }

    Widget buildSortButton() {
      final options = [
        "library_page_sort_created".tr(),
        "library_page_sort_title".tr()
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
                  )
                ],
              ),
            );
          }).toList();
        },
        onSelected: (int value) {
          selectedAlbumSortOrder.value = value;
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: MediaQuery.of(context).size.width / 2 - 18,
              height: MediaQuery.of(context).size.width / 2 - 18,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.grey,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Icon(
                  Icons.add_rounded,
                  size: 28,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: const Text(
                'library_page_new_album',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            )
          ],
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
                fontSize: 12.0,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white
                    : Colors.black,
              ),
            ),
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(12),
            side: BorderSide(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.grey[600]!
                  : Colors.grey[300]!,
            ),
            alignment: Alignment.centerLeft,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6.0),
            ),
          ),
          icon: Icon(icon, color: Theme.of(context).primaryColor),
        ),
      );
    }

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
                      "library_page_favorites".tr(), Icons.star_border, () {
                    AutoRouter.of(context).navigate(const FavoritesRoute());
                  }),
                  const SizedBox(width: 12.0),
                  buildLibraryNavButton(
                      "library_page_sharing".tr(), Icons.group_outlined, () {
                    AutoRouter.of(context).navigate(const SharingRoute());
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
            padding: const EdgeInsets.only(left: 12.0, right: 12, bottom: 50),
            sliver: SliverToBoxAdapter(
              child: Wrap(
                spacing: 12,
                children: [
                  buildCreateAlbumButton(),
                  for (var album in sortedAlbums())
                    AlbumThumbnailCard(
                      album: album,
                    ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
