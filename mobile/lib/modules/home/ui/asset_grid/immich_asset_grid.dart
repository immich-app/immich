import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid_view.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

class ImmichAssetGrid extends HookConsumerWidget {
  final int? assetsPerRow;
  final double margin;
  final bool? showStorageIndicator;
  final ImmichAssetGridSelectionListener? listener;
  final bool selectionActive;
  final List<Asset>? assets;
  final RenderList? renderList;
  final Future<void> Function()? onRefresh;
  final Set<Asset>? preselectedAssets;
  final bool canDeselect;
  final bool? dynamicLayout;
  final bool showMultiSelectIndicator;
  final void Function(Iterable<ItemPosition> itemPositions)?
      visibleItemsListener;
  final Widget? topWidget;
  final bool shrinkWrap;
  final bool showDragScroll;
  final bool showStack;

  const ImmichAssetGrid({
    super.key,
    this.assets,
    this.onRefresh,
    this.renderList,
    this.assetsPerRow,
    this.showStorageIndicator,
    this.listener,
    this.margin = 2.0,
    this.selectionActive = false,
    this.preselectedAssets,
    this.canDeselect = true,
    this.dynamicLayout,
    this.showMultiSelectIndicator = true,
    this.visibleItemsListener,
    this.topWidget,
    this.shrinkWrap = false,
    this.showDragScroll = true,
    this.showStack = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var settings = ref.watch(appSettingsServiceProvider);

    final perRow = useState(
      assetsPerRow ?? settings.getSetting(AppSettingsEnum.tilesPerRow)!,
    );
    final scaleFactor = useState(7.0 - perRow.value);
    final baseScaleFactor = useState(7.0 - perRow.value);

    /// assets need different hero tags across tabs / modals
    /// otherwise, hero animations are performed across tabs (looks buggy!)
    int heroOffset() {
      const int range = 1152921504606846976; // 2^60
      final tabScope = TabsRouterScope.of(context);
      if (tabScope != null) {
        final int tabIndex = tabScope.controller.activeIndex;
        return tabIndex * range;
      }
      return range * 7;
    }

    Widget buildAssetGridView(RenderList renderList) {
      return RawGestureDetector(
        gestures: {
          CustomScaleGestureRecognizer: GestureRecognizerFactoryWithHandlers<
                  CustomScaleGestureRecognizer>(
              () => CustomScaleGestureRecognizer(),
              (CustomScaleGestureRecognizer scale) {
            scale.onStart = (details) {
              baseScaleFactor.value = scaleFactor.value;
            };

            scale.onUpdate = (details) {
              scaleFactor.value = max(
                min(5.0, baseScaleFactor.value * details.scale),
                1.0,
              );
              if (7 - scaleFactor.value.toInt() != perRow.value) {
                perRow.value = 7 - scaleFactor.value.toInt();
              }
            };
          }),
        },
        child: ImmichAssetGridView(
          onRefresh: onRefresh,
          assetsPerRow: perRow.value,
          listener: listener,
          showStorageIndicator: showStorageIndicator ??
              settings.getSetting(AppSettingsEnum.storageIndicator),
          renderList: renderList,
          margin: margin,
          selectionActive: selectionActive,
          preselectedAssets: preselectedAssets,
          canDeselect: canDeselect,
          dynamicLayout: dynamicLayout ??
              settings.getSetting(AppSettingsEnum.dynamicLayout),
          showMultiSelectIndicator: showMultiSelectIndicator,
          visibleItemsListener: visibleItemsListener,
          topWidget: topWidget,
          heroOffset: heroOffset(),
          shrinkWrap: shrinkWrap,
          showDragScroll: showDragScroll,
          showStack: showStack,
        ),
      );
    }

    if (renderList != null) return buildAssetGridView(renderList!);

    final renderListFuture = ref.watch(renderListProvider(assets!));
    return renderListFuture.widgetWhen(
      onData: (renderList) => buildAssetGridView(renderList),
    );
  }
}

/// accepts a gesture even though it should reject it (because child won)
class CustomScaleGestureRecognizer extends ScaleGestureRecognizer {
  @override
  void rejectGesture(int pointer) {
    acceptGesture(pointer);
  }
}
