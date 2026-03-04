import 'dart:async';
import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/album/album_tile.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AppearsInDetails extends ConsumerWidget {
  final BaseAsset asset;

  const AppearsInDetails({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!asset.hasRemote) return const SizedBox.shrink();

    final remoteAssetId = switch (asset) {
      RemoteAsset(:final id) => id,
      LocalAsset(:final remoteAssetId) => remoteAssetId,
    };

    if (remoteAssetId == null) return const SizedBox.shrink();

    final userId = ref.watch(currentUserProvider)?.id;
    final assetAlbums = ref.watch(albumsContainingAssetProvider(remoteAssetId));

    return assetAlbums.when(
      data: (albums) {
        if (albums.isEmpty) return const SizedBox.shrink();

        albums.sortBy((a) => a.name);

        return Padding(
          padding: const EdgeInsets.only(top: 16.0),
          child: Column(
            spacing: 12,
            children: [
              SheetTile(
                title: 'appears_in'.t(context: context),
                titleStyle: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Column(
                  spacing: 12,
                  children: albums.map((album) {
                    final isOwner = album.ownerId == userId;
                    return AlbumTile(
                      album: album,
                      isOwner: isOwner,
                      onAlbumSelected: (album) async {
                        ref.invalidate(assetViewerProvider);
                        unawaited(context.router.popAndPush(RemoteAlbumRoute(album: album)));
                      },
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
