import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
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
  final ScrollController _scrollController = ScrollController();

  Future<void> onRefresh() async {
    await ref.read(remoteAlbumProvider.notifier).refresh();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final albumCount = ref.watch(remoteAlbumProvider.select((state) => state.albums.length));
    final showScrollbar = albumCount > 20;

    final scrollView = CustomScrollView(
      controller: _scrollController,
      slivers: [
        ImmichSliverAppBar(
          snap: false,
          floating: false,
          pinned: true,
          actions: [
            IconButton(
              onPressed: () => context.pushRoute(const DriftCreateAlbumRoute()),
              icon: const Icon(Icons.add_rounded),
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
    );

    return RefreshIndicator(
      onRefresh: onRefresh,
      edgeOffset: 100,
      child: showScrollbar
          ? RawScrollbar(
              controller: _scrollController,
              interactive: true,
              thickness: 8,
              radius: const Radius.circular(4),
              thumbVisibility: false,
              thumbColor: context.colorScheme.primary,
              crossAxisMargin: 4,
              mainAxisMargin: 60,
              minThumbLength: 40,
              child: scrollView,
            )
          : scrollView,
    );
  }
}
