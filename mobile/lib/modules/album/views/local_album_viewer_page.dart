import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/shared/ui/asset_grid/multiselect_grid.dart';

@RoutePage()
class LocalAlbumViewerPage extends HookConsumerWidget {
  final LocalAlbum album;
  final bool selectEnabled;

  const LocalAlbumViewerPage({
    super.key,
    required this.album,
    this.selectEnabled = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(),
      body: MultiselectGrid(
        topWidget: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 24),
          child: Text(
            album.name,
            style: context.textTheme.headlineMedium,
          ),
        ),
        renderListProvider: localAlbumRenderlistProvider(album.isarId),
        selectedEnabled: selectEnabled,
      ),
    );
  }
}
