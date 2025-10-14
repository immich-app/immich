import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/local_album_thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/local_album_sliver_app_bar.dart';

@RoutePage()
class DriftLocalAlbumsPage extends StatelessWidget {
  const DriftLocalAlbumsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: CustomScrollView(slivers: [LocalAlbumsSliverAppBar(), _AlbumList()]));
  }
}

class _AlbumList extends ConsumerWidget {
  const _AlbumList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(localAlbumProvider);

    return albums.when(
      loading: () => const SliverToBoxAdapter(
        child: Center(
          child: Padding(padding: EdgeInsets.all(20.0), child: CircularProgressIndicator()),
        ),
      ),
      error: (error, stack) => SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(
              'Error loading albums: $error, stack: $stack',
              style: TextStyle(color: context.colorScheme.error),
            ),
          ),
        ),
      ),
      data: (albums) {
        if (albums.isEmpty) {
          return SliverToBoxAdapter(
            child: Center(
              child: Padding(padding: const EdgeInsets.all(20.0), child: Text('no_albums_yet'.tr())),
            ),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.all(18.0),
          sliver: SliverList.builder(
            itemBuilder: (_, index) {
              final album = albums[index];

              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: LargeLeadingTile(
                  leadingPadding: const EdgeInsets.only(right: 16),
                  leading: SizedBox(width: 80, height: 80, child: LocalAlbumThumbnail(albumId: album.id)),
                  title: Text(album.name, style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    'items_count'.t(context: context, args: {'count': album.assetCount}),
                    style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
                  ),
                  onTap: () => context.pushRoute(LocalTimelineRoute(album: album)),
                ),
              );
            },
            itemCount: albums.length,
          ),
        );
      },
    );
  }
}
