import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/base_album.model.dart';
import 'package:immich_mobile/presentation/widgets/albums/album_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AlbumWidget extends StatelessWidget {
  const AlbumWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Album Page')),
      body: Consumer(
        builder: (ctx, ref, _) {
          final albumService = ref.watch(albumServiceProvider);
          final assetService = ref.watch(assetServiceProvider);

          return CustomScrollView(
            slivers: [
              FutureBuilder(
                future: albumService.loadAlbums(),
                builder: (_, snap) {
                  final albums = snap.data ?? [];
                  if (albums.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }

                  albums.sortBy((a) => a.name);
                  return SliverList.builder(
                    itemBuilder: (_, index) {
                      final album = albums[index];

                      return FutureBuilder(
                        future: assetService.getAsset(
                          (album as Album).thumbnailAssetId!,
                        ),
                        builder: (_, snap) {
                          final thumbnailAsset = snap.data!;
                          return AlbumTile(
                            name: album.name,
                            description: album.description,
                            thumbnailAsset: thumbnailAsset,
                            onTap: () => context.pushRoute(
                              LocalTimelineRoute(albumId: album.id),
                            ),
                          );
                        },
                      );
                    },
                    itemCount: albums.length,
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
