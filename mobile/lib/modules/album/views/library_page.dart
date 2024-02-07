// ignore_for_file: prefer-sliver-prefix

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/album_sort_by_options.provider.dart';
import 'package:immich_mobile/modules/album/providers/local_album.provider.dart';
import 'package:immich_mobile/modules/album/providers/remote_album.provider.dart';
import 'package:immich_mobile/modules/album/providers/sorted_album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_sort_selector.dart';
import 'package:immich_mobile/modules/album/ui/album_thumbnail_card.dart';
import 'package:immich_mobile/modules/album/ui/library_nav_button.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/ui/immich_app_bar.dart';

@RoutePage()
class LibraryPage extends HookConsumerWidget {
  const LibraryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(
      () {
        ref.read(remoteAlbumsProvider.notifier).getRemoteAlbums();
        ref.read(localAlbumsProvider.notifier).getDeviceAlbums();
        return null;
      },
      [],
    );

    return Scaffold(
      appBar: _LibraryAppBar(),
      body: CustomScrollView(
        slivers: [
          _SilverLibraryNavigationButtons(),
          _SilverLibraryRemoteAlbumHeader(),
          _SilverLibraryRemoteAlbumGrid(),
          _SilverLibraryLocalAlbumHeader(),
          _SilverLibraryLocalAlbumGrid(),
        ],
      ),
    );
  }
}

class _LibraryAppBar extends ImmichAppBar {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    return ImmichAppBar(
      action: trashEnabled
          ? InkWell(
              onTap: () => context.pushRoute(const TrashRoute()),
              borderRadius: const BorderRadius.all(Radius.circular(12)),
              child: const Icon(
                Icons.delete_rounded,
                size: 25,
              ),
            )
          : null,
    );
  }
}

class _SilverLibraryNavigationButtons extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            LibraryNavButton(
              label: "library_page_favorites",
              icon: Icons.favorite_border,
              onClick: () => context.navigateTo(const FavoritesRoute()),
            ),
            LibraryNavButton(
              label: "library_page_archive",
              icon: Icons.archive_outlined,
              onClick: () => context.navigateTo(const ArchiveRoute()),
            ),
          ],
        ),
      ),
    );
  }
}

class _SilverLibraryRemoteAlbumHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'library_page_albums',
              style: context.textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ).tr(),
            const AlbumSortSelector(sortModes: AlbumSortMode.values),
          ],
        ),
      ),
    );
  }
}

class _SilverLibraryRemoteAlbumGrid extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remoteAlbums = ref.watch(remoteAlbumsProvider);
    final remoteSorted =
        ref.watch(sortedAlbumProvider(remoteAlbums.valueOrNull ?? []));
    return SliverPadding(
      padding: const EdgeInsets.all(12),
      sliver: SliverGrid.builder(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 250,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: .7,
        ),
        itemCount: remoteSorted.length + 1,
        itemBuilder: (ctx, index) {
          if (index == 0) {
            Album placeholder = LocalAlbum(
              id: 'Placeholder',
              name: 'library_page_new_album'.tr(),
              modifiedAt: DateTime.now(),
            );
            return AlbumThumbnailCard(
              album: placeholder,
              showAssetCount: false,
              emptyThumbnailPlaceholder: Icon(
                Icons.add_rounded,
                size: 28,
                color: context.primaryColor,
              ),
              onTap: () =>
                  context.pushRoute(CreateAlbumRoute(isSharedAlbum: false)),
            );
          }
          final remoteAlbum = remoteSorted[index - 1];

          return AlbumThumbnailCard(
            album: remoteAlbum,
            onTap: () => context
                .pushRoute(RemoteAlbumViewerRoute(albumId: remoteAlbum.isarId)),
          );
        },
      ),
    );
  }
}

class _SilverLibraryLocalAlbumHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
        child: Text(
          'library_page_device_albums',
          style: context.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ).tr(),
      ),
    );
  }
}

class _SilverLibraryLocalAlbumGrid extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localAlbums = ref.watch(localAlbumsProvider).valueOrNull ?? [];
    final localWithoutRecents =
        localAlbums.where((e) => e.id != LocalAlbum.isAllId).toList();

    return SliverPadding(
      padding: const EdgeInsets.all(12),
      sliver: SliverGrid.builder(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 250,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: .7,
        ),
        itemCount: localWithoutRecents.length,
        itemBuilder: (ctx, index) => AlbumThumbnailCard(
          album: localWithoutRecents[index],
          onTap: () => context.pushRoute(
            LocalAlbumViewerRoute(album: localWithoutRecents[index]),
          ),
        ),
      ),
    );
  }
}
