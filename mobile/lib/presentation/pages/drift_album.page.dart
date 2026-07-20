import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/page_chrome/tab_page.dart';
import 'package:immich_mobile/widgets/common/page_chrome/types.dart';
import 'package:immich_mobile/widgets/common/primary_app_bar.dart';

@RoutePage()
class DriftAlbumsPage extends TabPage {
  const DriftAlbumsPage({super.key});

  @override
  ProviderListenable<PageChromeContent> get content => Provider<PageChromeContent>((ref) {
    final albumCount = ref.watch(remoteAlbumProvider.select((state) => state.albums.length));
    final showScrollbar = albumCount > 20;

    return PageChromeContent(
      physics: const AlwaysScrollableScrollPhysics(),
      appBar: const PrimaryAppBar(
        snap: false,
        floating: false,
        pinned: true,
        showUploadButton: false,
        actions: [_CreateAlbumAction()],
      ),
      viewportBuilder: (scrollView) => _AlbumRefreshWrapper(showScrollbar: showScrollbar, scrollView: scrollView),
      slivers: [const _AlbumSelectorSliver()],
    );
  });
}

class _CreateAlbumAction extends StatelessWidget {
  const _CreateAlbumAction();

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => context.pushRoute(const DriftCreateAlbumRoute()),
      icon: const Icon(Icons.add_rounded),
    );
  }
}

class _AlbumSelectorSliver extends StatelessWidget {
  const _AlbumSelectorSliver();

  @override
  Widget build(BuildContext context) {
    return AlbumSelector(onAlbumSelected: (album) => context.router.push(RemoteAlbumRoute(album: album)));
  }
}

class _AlbumRefreshWrapper extends ConsumerWidget {
  final bool showScrollbar;
  final CustomScrollView scrollView;

  const _AlbumRefreshWrapper({required this.showScrollbar, required this.scrollView});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = PrimaryScrollController.of(context);
    return RefreshIndicator(
      onRefresh: () => ref.read(remoteAlbumProvider.notifier).refresh(),
      edgeOffset: 100,
      child: showScrollbar
          ? RawScrollbar(
              controller: controller,
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
