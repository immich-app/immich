import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_card.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:openapi/api.dart';

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

    List<AlbumResponseDto> sortedAlbums() {
      if (selectedAlbumSortOrder.value == 0) {
        return albums.sortedBy((album) => album.createdAt).reversed.toList();
      }
      return albums.sortedBy((album) => album.albumName);
    }

    Widget buildSortButton() {
      const options = ["Most recently created", "Album title"];

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
                    style: selected
                        ? TextStyle(color: Theme.of(context).primaryColor)
                        : null,
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
              Icons.swap_vert,
              size: 28,
              color: Theme.of(context).primaryColor,
            ),
            Text(
              options[selectedAlbumSortOrder.value],
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).primaryColor,
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

    return Scaffold(
      appBar: buildAppBar(),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
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
