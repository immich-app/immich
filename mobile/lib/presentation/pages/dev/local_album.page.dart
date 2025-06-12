import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/album.service.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/presentation/widgets/albums/album.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

@RoutePage()
class LocalAlbumPage extends StatelessWidget {
  const LocalAlbumPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        albumServiceProvider.overrideWith(
          (ref) => AlbumService.localAlbum(
            repository: ref.watch(localAlbumRepositoryProvider),
          ),
        ),
        assetServiceProvider.overrideWith(
          (ref) => AssetService.localAsset(
            repository: ref.watch(localAssetRepositoryProvider),
          ),
        ),
      ],
      child: const AlbumWidget(),
    );
  }
}
