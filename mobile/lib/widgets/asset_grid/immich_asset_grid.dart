import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/timeline.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid_view.dart';
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
  final void Function(Iterable<ItemPosition> itemPositions)? visibleItemsListener;
  final Widget? topWidget;
  final bool shrinkWrap;
  final bool showDragScroll;
  final bool showDragScrollLabel;
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
    this.showDragScrollLabel = true,
    this.showStack = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final configuredPerRow = ref.watch(tilesPerRowSettingProvider).valueOrNull ?? Setting.tilesPerRow.defaultValue;
    final configuredDynamicLayout = ref.watch(dynamicLayoutSettingProvider).valueOrNull ?? false;
    final configuredStorageIndicator =
        ref.watch(storageIndicatorSettingProvider).valueOrNull ?? Setting.showStorageIndicator.defaultValue;

    final perRow = useState(assetsPerRow ?? configuredPerRow);
    final scaleFactor = useState(7.0 - perRow.value);
    final baseScaleFactor = useState(7.0 - perRow.value);

    useEffect(() {
      if (assetsPerRow != null || perRow.value == configuredPerRow) {
        return null;
      }

      perRow.value = configuredPerRow;
      scaleFactor.value = 7.0 - configuredPerRow;
      baseScaleFactor.value = 7.0 - configuredPerRow;
      return null;
    }, [assetsPerRow, configuredPerRow]);

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
          CustomScaleGestureRecognizer: GestureRecognizerFactoryWithHandlers<CustomScaleGestureRecognizer>(
            () => CustomScaleGestureRecognizer(),
            (CustomScaleGestureRecognizer scale) {
              scale.onStart = (details) {
                baseScaleFactor.value = scaleFactor.value;
              };

              scale.onUpdate = (details) {
                scaleFactor.value = max(min(5.0, baseScaleFactor.value * details.scale), 1.0);
                if (7 - scaleFactor.value.toInt() != perRow.value) {
                  perRow.value = 7 - scaleFactor.value.toInt();
                  ref.read(settingsProvider.notifier).set(Setting.tilesPerRow, perRow.value);
                }
              };
            },
          ),
        },
        child: ImmichAssetGridView(
          onRefresh: onRefresh,
          assetsPerRow: perRow.value,
          listener: listener,
          showStorageIndicator: showStorageIndicator ?? configuredStorageIndicator,
          renderList: renderList,
          margin: margin,
          selectionActive: selectionActive,
          preselectedAssets: preselectedAssets,
          canDeselect: canDeselect,
          dynamicLayout: dynamicLayout ?? configuredDynamicLayout,
          showMultiSelectIndicator: showMultiSelectIndicator,
          visibleItemsListener: visibleItemsListener,
          topWidget: topWidget,
          heroOffset: heroOffset(),
          shrinkWrap: shrinkWrap,
          showDragScroll: showDragScroll,
          showStack: showStack,
          showLabel: showDragScrollLabel,
        ),
      );
    }

    if (renderList != null) return buildAssetGridView(renderList!);

    final renderListFuture = ref.watch(assetsTimelineProvider(assets!));
    return renderListFuture.widgetWhen(onData: (renderList) => buildAssetGridView(renderList));
  }
}

/// accepts a gesture even though it should reject it (because child won)
class CustomScaleGestureRecognizer extends ScaleGestureRecognizer {
  @override
  void rejectGesture(int pointer) {
    acceptGesture(pointer);
  }
}
