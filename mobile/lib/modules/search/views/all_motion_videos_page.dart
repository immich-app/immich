import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/all_motion_photos.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class AllMotionPhotosPage extends HookConsumerWidget {
  const AllMotionPhotosPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final motionPhotos = ref.watch(allMotionPhotosProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Motion Photos'),
      ),
      body: motionPhotos.when(
        data: (assets) => ImmichAssetGrid(
          assets: assets, 
        ),
        error: (e, s) => Text(e.toString()),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
