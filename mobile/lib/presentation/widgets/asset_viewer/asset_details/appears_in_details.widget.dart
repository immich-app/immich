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
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AppearsInDetails extends ConsumerWidget {
  const AppearsInDetails({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null || !asset.hasRemote) return const SizedBox.shrink();

    String? remoteAssetId;
    if (asset is RemoteAsset) {
      remoteAssetId = asset.id;
    } else if (asset is LocalAsset) {
      remoteAssetId = asset.remoteAssetId;
    }

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
