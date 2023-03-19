import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_card.dart';
import 'package:immich_mobile/modules/album/ui/sharing_sliver_appbar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/store.dart' as store;
import 'package:immich_mobile/shared/ui/immich_image.dart';

class SharingPage extends HookConsumerWidget {
  const SharingPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<Album> sharedAlbums = ref.watch(sharedAlbumProvider);
    final userId = store.Store.get(store.StoreKey.userRemoteId);
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;

    useEffect(
      () {
        ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();
        return null;
      },
      [],
    );

    buildAlbumGrid() {
      return SliverPadding(
        padding: const EdgeInsets.all(18.0),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 250,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: .7,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              return AlbumThumbnailCard(
                album: sharedAlbums[index],
                showOwner: true,
                onTap: () {
                  AutoRouter.of(context)
                      .push(AlbumViewerRoute(albumId: sharedAlbums[index].id));
                },
              );
            },
            childCount: sharedAlbums.length,
          ),
        ),
      );
    }

    buildAlbumList() {
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (BuildContext context, int index) {
            final album = sharedAlbums[index];
            final isOwner = album.ownerId == userId;

            return ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ImmichImage(
                  album.thumbnail.value,
                  width: 60,
                  height: 60,
                ),
              ),
              title: Text(
                album.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isDarkMode
                          ? Theme.of(context).primaryColor
                          : Colors.black,
                    ),
              ),
              subtitle: isOwner
                  ? const Text(
                      'Owned',
                      style: TextStyle(
                        fontSize: 12.0,
                      ),
                    )
                  : album.ownerName != null
                      ? Text(
                          'Shared by ${album.ownerName!}',
                          style: const TextStyle(
                            fontSize: 12.0,
                          ),
                        )
                      : null,
              onTap: () {
                AutoRouter.of(context)
                    .push(AlbumViewerRoute(albumId: sharedAlbums[index].id));
              },
            );
          },
          childCount: sharedAlbums.length,
        ),
      );
    }

    buildEmptyListIndication() {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: const BorderSide(
                color: Colors.grey,
                width: 0.5,
              ),
            ),
            // color: Colors.transparent,
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 5.0, bottom: 5),
                    child: Icon(
                      Icons.insert_photo_rounded,
                      size: 50,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      'sharing_page_empty_list',
                      style: Theme.of(context).textTheme.displaySmall,
                    ).tr(),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      'sharing_page_description',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ).tr(),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SharingSliverAppBar(),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            sliver: SliverToBoxAdapter(
              child: const Text(
                "sharing_page_album",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            ),
          ),
          SliverLayoutBuilder(
            builder: (context, constraints) {
              if (sharedAlbums.isEmpty) {
                return buildEmptyListIndication();
              }

              if (constraints.crossAxisExtent < 600) {
                return buildAlbumList();
              } else {
                return buildAlbumGrid();
              }
            },
          ),
        ],
      ),
    );
  }
}
