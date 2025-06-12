import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/album.service.dart';
import 'package:immich_mobile/presentation/widgets/albums/album.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

@RoutePage()
class RemoteAlbumPage extends StatelessWidget {
  const RemoteAlbumPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        albumServiceProvider.overrideWith(
          (ref) => AlbumService.remoteAlbum(
            repository: ref.watch(remoteAlbumRepositoryProvider),
          ),
        ),
      ],
      child: const Album(),
    );
  }
}
