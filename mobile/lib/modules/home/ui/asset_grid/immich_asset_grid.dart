import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid_view.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class ImmichAssetGrid extends HookConsumerWidget {
  final int? assetsPerRow;
  final double margin;
  final bool? showStorageIndicator;
  final ImmichAssetGridSelectionListener? listener;
  final bool selectionActive;
  final List<Asset> assets;
  final RenderList? renderList;

  const ImmichAssetGrid({
    super.key,
    required this.assets,
    this.renderList,
    this.assetsPerRow,
    this.showStorageIndicator,
    this.listener,
    this.margin = 5.0,
    this.selectionActive = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var settings = ref.watch(appSettingsServiceProvider);
    final renderListFuture = ref.watch(renderListProvider(assets));

    if (renderList != null) {
      return ImmichAssetGridView(
        allAssets: assets,
        assetsPerRow: assetsPerRow 
          ?? settings.getSetting(AppSettingsEnum.tilesPerRow),
        listener: listener,
        showStorageIndicator: showStorageIndicator 
          ?? settings.getSetting(AppSettingsEnum.storageIndicator),
        renderList: renderList!,
        margin: margin,
        selectionActive: selectionActive,
      );
    }

    return renderListFuture.when(
      data: (renderList) =>
        ImmichAssetGridView(
          allAssets: assets,
          assetsPerRow: assetsPerRow 
            ?? settings.getSetting(AppSettingsEnum.tilesPerRow),
          listener: listener,
          showStorageIndicator: showStorageIndicator 
            ?? settings.getSetting(AppSettingsEnum.storageIndicator),
          renderList: renderList,
          margin: margin,
          selectionActive: selectionActive,
        ),
      error: (err, stack) =>
        Center(child: Text("$err")),
      loading: () =>
        const ImmichLoadingIndicator(),
    );
  }
}
