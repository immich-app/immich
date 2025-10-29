import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';

@RoutePage()
class DriftAlbumsPage extends ConsumerStatefulWidget {
  const DriftAlbumsPage({super.key});

  @override
  ConsumerState<DriftAlbumsPage> createState() => _DriftAlbumsPageState();
}

class _DriftAlbumsPageState extends ConsumerState<DriftAlbumsPage> {
  Future<void> onRefresh() async {
    await ref.read(remoteAlbumProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      edgeOffset: 100,
      child: CustomScrollView(
        slivers: [
          ImmichSliverAppBar(
            snap: false,
            floating: false,
            pinned: true,
            actions: [
              IconButton(
                icon: const Icon(Icons.add_rounded, size: 28),
                onPressed: () => context.pushRoute(const DriftCreateAlbumRoute()),
              ),
            ],
            showUploadButton: false,
          ),
          AlbumSelector(
            onAlbumSelected: (album) {
              context.router.push(RemoteAlbumRoute(album: album));
            },
          ),
        ],
      ),
    );
  }
}
