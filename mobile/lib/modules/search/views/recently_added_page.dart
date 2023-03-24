import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/recently_added.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class RecentlyAddedPage extends HookConsumerWidget {
  const RecentlyAddedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recents = ref.watch(recentlyAddedProvider);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recently Added'),
      ),
      body: recents.when(
        data: (searchResponse) =>
          ImmichAssetGrid(
            assets: searchResponse,
          ),
        error: (e, s) => Text(e.toString()),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
