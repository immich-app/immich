import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class Album extends StatelessWidget {
  const Album({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Album page')),
      body: Consumer(
        builder: (ctx, ref, _) {
          final albumService = ref.watch(albumServiceProvider);

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
                      return ListTile(
                        leading: const Icon(
                          Icons.photo_album_rounded,
                        ),
                        title: Text(album.name),
                        onTap: () => context.pushRoute(
                          LocalTimelineRoute(
                            albumId: album.id,
                          ),
                        ),
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
