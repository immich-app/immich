import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_listtile.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';

class AddToAlbumList extends HookConsumerWidget {

  const AddToAlbumList({
    Key? key,
    required this.asset,
  }) : super(key: key);

  final Asset asset;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);
    final albumService = ref.watch(albumServiceProvider);

    return ListView.builder(
      padding: const EdgeInsets.all(18.0),
      itemCount: albums.length + 1, // +1 for the header
      itemBuilder: (_, index) {
        // Build header
        if (index == 0) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Align(
                alignment: Alignment.center,
                child: CustomDraggingHandle(),
              ),
              const SizedBox(height: 12),
              Text('Add to album',
                style: Theme.of(context).textTheme.headline1,
              ),
              TextButton.icon(
                icon: const Icon(Icons.add),
                label: const Text('New album'),
                onPressed: () {
                  AutoRouter.of(context).push(
                    CreateAlbumRoute(
                      isSharedAlbum: false,
                      initialAssets: [asset],
                    ),
                  );
                },
              ),
            ],
          );
        }

        // Offset for header
        final album = albums[index - 1];
        return AlbumThumbnailListTile(
          album: album,
          onTap: () {
            albumService.addAdditionalAssetToAlbum([asset], album.id);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Added to ${album.albumName}'),
              ),
            );
            Navigator.pop(context);
          },
        );
      },
    );
  }
}
