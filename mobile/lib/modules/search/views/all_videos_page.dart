import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/all_video_assets.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';
import 'package:isar/isar.dart';

class AllVideosPage extends HookConsumerWidget {
  const AllVideosPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final videos = ref.watch(allVideoAssetsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Videos'),
      ),
      body: videos.when(
        data: (assets) => ImmichAssetGrid(
          assets: assets, 
        ),
        error: (e, s) => Text(e.toString()),
        loading: () => const Center(
          child: ImmichLoadingOverlay(),
        ),
      ),
    );
  }
}
