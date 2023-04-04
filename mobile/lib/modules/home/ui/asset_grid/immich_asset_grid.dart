import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
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
  final Future<void> Function()? onRefresh;

  const ImmichAssetGrid({
    super.key,
    required this.assets,
    this.onRefresh,
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

    // Needs to suppress hero animations when navigating to this widget
    final enableHeroAnimations = useState(false);
    final transitionDuration = ModalRoute.of(context)?.transitionDuration;

    useEffect(
      () {
        // Wait for transition to complete, then re-enable
        if (transitionDuration == null) {
          // No route transition found, maybe we opened this up first
          enableHeroAnimations.value = true;
        } else {
          // Unfortunately, using the transition animation itself didn't
          // seem to work reliably. So instead, wait until the duration of the
          // animation has elapsed to re-enable the hero animations
          Future.delayed(transitionDuration)
              .then((_) {
                enableHeroAnimations.value = true;
              });
        }
        return null;
      },
      [],
    );

    Future<bool> onWillPop() async {
      enableHeroAnimations.value = false;
      return true;
    }

    if (renderList != null) {
      return WillPopScope(
        onWillPop: onWillPop,
        child: HeroMode(
          enabled: enableHeroAnimations.value,
          child: ImmichAssetGridView(
            allAssets: assets,
            onRefresh: onRefresh,
            assetsPerRow: assetsPerRow ??
                settings.getSetting(AppSettingsEnum.tilesPerRow),
            listener: listener,
            showStorageIndicator: showStorageIndicator ??
                settings.getSetting(AppSettingsEnum.storageIndicator),
            renderList: renderList!,
            margin: margin,
            selectionActive: selectionActive,
          ),
        ),
      );
    }

    return renderListFuture.when(
      data: (renderList) => WillPopScope(
        onWillPop: onWillPop,
        child: HeroMode(
          enabled: enableHeroAnimations.value,
          child: ImmichAssetGridView(
            allAssets: assets,
            onRefresh: onRefresh,
            assetsPerRow: assetsPerRow ??
                settings.getSetting(AppSettingsEnum.tilesPerRow),
            listener: listener,
            showStorageIndicator: showStorageIndicator ??
                settings.getSetting(AppSettingsEnum.storageIndicator),
            renderList: renderList,
            margin: margin,
            selectionActive: selectionActive,
          ),
        ),
      ),
      error: (err, stack) => Center(child: Text("$err")),
      loading: () => const Center(
        child: ImmichLoadingIndicator(),
      ),
    );
  }
}
