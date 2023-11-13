import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/all_video_assets.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class AllVideosPage extends HookConsumerWidget {
  const AllVideosPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final videos = ref.watch(allVideoAssetsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('all_videos_page_title').tr(),
        leading: IconButton(
          onPressed: () => context.autoPop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: videos.when(
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
