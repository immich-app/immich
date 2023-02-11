import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/ui/add_to_album_sliverlist.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class AddToAlbumBottomSheet extends HookConsumerWidget {
  /// The asset to add to an album
  final List<Asset> assets;

  const AddToAlbumBottomSheet({
    Key? key,
    required this.assets,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);
    final albumService = ref.watch(albumServiceProvider);
    final sharedAlbums = ref.watch(sharedAlbumProvider);

    useEffect(
      () {
        // Fetch album updates, e.g., cover image
        ref.read(albumProvider.notifier).getAllAlbums();
        ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();

        return null;
      },
      [],
    );

    void addToAlbum(Album album) async {
      final result = await albumService.addAdditionalAssetToAlbum(
        assets,
        album,
      );

      if (result != null) {
        if (result.alreadyInAlbum.isNotEmpty) {
          ImmichToast.show(
            context: context,
            msg: 'Already in ${album.name}',
          );
        } else {
          ImmichToast.show(
            context: context,
            msg: 'Added to ${album.name}',
          );
        }
      }

      ref.read(albumProvider.notifier).getAllAlbums();
      ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();

      Navigator.pop(context);
    }

    return Card(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(15),
          topRight: Radius.circular(15),
        ),
      ),
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  const Align(
                    alignment: Alignment.center,
                    child: CustomDraggingHandle(),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Add to album',
                        style: Theme.of(context).textTheme.displayMedium,
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Create new album'),
                        onPressed: () {
                          ref
                              .watch(assetSelectionProvider.notifier)
                              .removeAll();
                          ref
                              .watch(assetSelectionProvider.notifier)
                              .addNewAssets(assets);
                          AutoRouter.of(context).push(
                            CreateAlbumRoute(
                              isSharedAlbum: false,
                              initialAssets: assets,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: AddToAlbumSliverList(
              albums: albums,
              sharedAlbums: sharedAlbums,
              onAddToAlbum: addToAlbum,
            ),
          ),
        ],
      ),
    );
  }
}
