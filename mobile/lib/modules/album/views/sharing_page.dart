import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_card.dart';
import 'package:immich_mobile/modules/partner/providers/partner.provider.dart';
import 'package:immich_mobile/modules/partner/ui/partner_list.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class SharingPage extends HookConsumerWidget {
  const SharingPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<Album> sharedAlbums = ref.watch(sharedAlbumProvider);
    final userId = ref.watch(currentUserProvider)?.id;
    final partner = ref.watch(partnerSharedWithProvider);
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
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
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
                  ? Text(
                      'album_thumbnail_owned'.tr(),
                      style: const TextStyle(
                        fontSize: 12.0,
                      ),
                    )
                  : album.ownerName != null
                      ? Text(
                          'album_thumbnail_shared_by'
                              .tr(args: [album.ownerName!]),
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

    buildTopBottons() {
      return Padding(
        padding: const EdgeInsets.only(
          left: 12.0,
          right: 12.0,
          top: 24.0,
          bottom: 12.0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  AutoRouter.of(context)
                      .push(CreateAlbumRoute(isSharedAlbum: true));
                },
                icon: const Icon(
                  Icons.photo_album_outlined,
                  size: 20,
                ),
                label: const Text(
                  "sharing_silver_appbar_create_shared_album",
                  maxLines: 1,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ).tr(),
              ),
            ),
            const SizedBox(width: 12.0),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () =>
                    AutoRouter.of(context).push(const PartnerRoute()),
                icon: const Icon(
                  Icons.swap_horizontal_circle_outlined,
                  size: 20,
                ),
                label: const Text(
                  "sharing_silver_appbar_share_partner",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                ).tr(),
              ),
            ),
          ],
        ),
      );
    }

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
      appBar: buildAppBar(),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: buildTopBottons()),
          if (partner.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.all(12),
              sliver: SliverToBoxAdapter(
                child: const Text(
                  "partner_page_title",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ).tr(),
              ),
            ),
          if (partner.isNotEmpty) PartnerList(partner: partner),
          SliverPadding(
            padding: const EdgeInsets.all(12),
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
