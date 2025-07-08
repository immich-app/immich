import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';
import 'package:immich_mobile/widgets/common/local_album_sliver_app_bar.dart';

@RoutePage()
class DriftLocalAlbumsPage extends ConsumerStatefulWidget {
  const DriftLocalAlbumsPage({super.key});

  @override
  ConsumerState<DriftLocalAlbumsPage> createState() => _DriftLocalAlbumsPageState();
}

class _DriftLocalAlbumsPageState extends ConsumerState<DriftLocalAlbumsPage> {
  @override
  void initState() {
    super.initState();

    // Load albums when component mounts
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(localAlbumProvider.notifier).getAll();
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final albumState = ref.watch(localAlbumProvider);
    final albums = albumState.albums;
    final isLoading = albumState.isLoading;
    final error = albumState.error;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const LocalAlbumsSliverAppBar(),
          _AlbumList(
            albums: albums,
            isLoading: isLoading,
            error: error,
          ),
        ],
      ),
    );
  }
}

class _AlbumList extends StatelessWidget {
  const _AlbumList({
    required this.isLoading,
    required this.error,
    required this.albums,
  });

  final bool isLoading;
  final String? error;
  final List<LocalAlbum> albums;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    if (error != null) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(
              'Error loading albums: $error',
              style: TextStyle(
                color: context.colorScheme.error,
              ),
            ),
          ),
        ),
      );
    }

    if (albums.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: Text('No albums found'),
          ),
        ),      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(18.0),
      sliver: SliverList.builder(
        itemBuilder: (_, index) {
          final album = albums[index];

          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: LargeLeadingTile(
              leadingPadding: const EdgeInsets.only(
                right: 16,
              ),
              leading: const ClipRRect(
                borderRadius: BorderRadius.all(Radius.circular(15)),
                child: SizedBox(
                  width: 80,
                  height: 80,
                  // TODO: Local album thumbnail
                  // child: Thumbnail(
                  //   asset:
                  // ),
                ),
              ),
              title: Text(
                album.name,
                style: context.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(
                'items_count'.t(
                  context: context,
                  args: {'count': album.assetCount},
                ),
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.colorScheme.onSurfaceSecondary,
                ),
              ),
              onTap: () => context
                  .pushRoute(LocalTimelineRoute(albumId: album.id)),
            ),
          );
        },
        itemCount: albums.length,
      ),
    );
  }
}
