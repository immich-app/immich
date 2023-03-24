import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class AllVideosPage extends HookConsumerWidget {
  const AllVideosPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var settings = ref.watch(appSettingsServiceProvider);
    final videos = <Asset>[];
    return Scaffold(
      appBar: AppBar(
        title: Text('Videos'),
      ),
      body: ImmichAssetGrid(
        assets: videos, 
      ),
    );

  }
}
