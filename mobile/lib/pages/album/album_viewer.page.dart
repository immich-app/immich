import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/pages/album/album_viewer.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';

@RoutePage()
class AlbumViewerPage extends HookConsumerWidget {
  final int albumId;

  const AlbumViewerPage({super.key, required this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listen provider to prevent autoDispose when navigating to other routes from within the viewer page
    ref.listen(currentAlbumProvider, (_, __) {});

    ref.listen(albumWatcher(albumId), (_, albumFuture) {
      albumFuture.whenData(
        (value) => ref.read(currentAlbumProvider.notifier).set(value),
      );
    });

    return const Scaffold(body: AlbumViewer());
  }
}
