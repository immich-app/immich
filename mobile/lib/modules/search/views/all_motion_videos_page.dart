import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/all_motion_photos.provider.dart';

class AllMotionPhotosPage extends HookConsumerWidget {
  const AllMotionPhotosPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final motionPhotos = ref.watch(allMotionPhotosProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('motion_photos_page_title').tr(),
        leading: IconButton(
          onPressed: () => context.autoPop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: motionPhotos.widgetWhen(
        onData: (assets) => ImmichAssetGrid(
          assets: assets,
        ),
      ),
    );
  }
}
