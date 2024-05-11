import 'dart:math' as math;
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/collection_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/render_list.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/models/map/map_event.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/widgets/common/drag_sheet.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:immich_mobile/utils/throttle.dart';
import 'package:logging/logging.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

class MapAssetGrid extends HookConsumerWidget {
  final Stream<MapEvent> mapEventStream;
  final Function(String)? onGridAssetChanged;
  final Function(String)? onZoomToAsset;
  final Function(bool, Set<Asset>)? onAssetsSelected;
  final ValueNotifier<Set<Asset>> selectedAssets;
  final ScrollController controller;

  const MapAssetGrid({
    required this.mapEventStream,
    this.onGridAssetChanged,
    this.onZoomToAsset,
    this.onAssetsSelected,
    required this.selectedAssets,
    required this.controller,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final log = Logger("MapAssetGrid");
    final assetsInBounds = useState<List<Asset>>([]);
    final cachedRenderList = useRef<RenderList?>(null);
    final lastRenderElementIndex = useRef<int?>(null);
    final assetInSheet = useValueNotifier<String?>(null);
    final gridScrollThrottler =
        useThrottler(interval: const Duration(milliseconds: 300));

    void handleMapEvents(MapEvent event) async {
      if (event is MapAssetsInBoundsUpdated) {
        assetsInBounds.value = await ref
            .read(dbProvider)
            .assets
            .getAllByRemoteId(event.assetRemoteIds);
        return;
      }
    }

    useOnStreamChange<MapEvent>(mapEventStream, onData: handleMapEvents);

    // Hard-restrict to 4 assets / row in portrait mode
    const assetsPerRow = 4;

    void handleVisibleItems(Iterable<ItemPosition> positions) {
      final orderedPos = positions.sortedByField((p) => p.index);
      // Index of row where the items are mostly visible
      const partialOffset = 0.20;
      final item = orderedPos
          .firstWhereOrNull((p) => p.itemTrailingEdge > partialOffset);

      // Guard no elements, reset state
      // Also fail fast when the sheet is just opened and the user is yet to scroll (i.e leading = 0)
      if (item == null || item.itemLeadingEdge == 0) {
        lastRenderElementIndex.value = null;
        return;
      }

      final renderElement =
          cachedRenderList.value?.elements.elementAtOrNull(item.index);
      // Guard no render list or render element
      if (renderElement == null) {
        return;
      }
      // Reset index
      lastRenderElementIndex.value == item.index;

      //  <RenderElement:offset:0>
      //  | 1 | 2 | 3 | 4 | 5 | 6 |
      //  <RenderElement:offset:6>
      //  | 7 | 8 | 9 |
      //  <RenderElement:offset:9>
      //  | 10 |

      // Skip through the assets from the previous row
      final rowOffset = renderElement.offset;
      // Column offset = (total trailingEdge - trailingEdge crossed) / offset for each asset
      final totalOffset = item.itemTrailingEdge - item.itemLeadingEdge;
      final edgeOffset = (totalOffset - partialOffset) /
          // Round the total count to the next multiple of [assetsPerRow]
          ((renderElement.totalCount / assetsPerRow) * assetsPerRow).floor();

      // trailing should never be above the totalOffset
      final columnOffset =
          (totalOffset - math.min(item.itemTrailingEdge, totalOffset)) ~/
              edgeOffset;
      final assetOffset = rowOffset + columnOffset;
      final selectedAsset = cachedRenderList.value?.allAssets
          ?.elementAtOrNull(assetOffset)
          ?.remoteId;

      if (selectedAsset != null) {
        onGridAssetChanged?.call(selectedAsset);
        assetInSheet.value = selectedAsset;
      }
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Stack(
        children: [
          /// The Align and FractionallySizedBox are to prevent the Asset Grid from going behind the
          /// _MapSheetDragRegion and thereby displaying content behind the top right and top left curves
          Align(
            alignment: Alignment.bottomCenter,
            child: FractionallySizedBox(
              // Place it just below the drag handle
              heightFactor: 0.80,
              child: assetsInBounds.value.isNotEmpty
                  ? ref.watch(renderListProvider(assetsInBounds.value)).when(
                        data: (renderList) {
                          // Cache render list here to use it back during visibleItemsListener
                          cachedRenderList.value = renderList;
                          return ValueListenableBuilder(
                            valueListenable: selectedAssets,
                            builder: (_, value, __) => ImmichAssetGrid(
                              shrinkWrap: true,
                              renderList: renderList,
                              showDragScroll: false,
                              assetsPerRow: assetsPerRow,
                              showMultiSelectIndicator: false,
                              selectionActive: value.isNotEmpty,
                              listener: onAssetsSelected,
                              visibleItemsListener: (pos) => gridScrollThrottler
                                  .run(() => handleVisibleItems(pos)),
                            ),
                          );
                        },
                        error: (error, stackTrace) {
                          log.warning(
                            "Cannot get assets in the current map bounds",
                            error,
                            stackTrace,
                          );
                          return const SizedBox.shrink();
                        },
                        loading: () => const SizedBox.shrink(),
                      )
                  : _MapNoAssetsInSheet(),
            ),
          ),
          _MapSheetDragRegion(
            controller: controller,
            assetsInBoundCount: assetsInBounds.value.length,
            assetInSheet: assetInSheet,
            onZoomToAsset: onZoomToAsset,
          ),
        ],
      ),
    );
  }
}

class _MapNoAssetsInSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const image = Image(
      height: 150,
      width: 150,
      image: AssetImage('assets/lighthouse.png'),
    );

    return Center(
      child: ListView(
        shrinkWrap: true,
        children: [
          context.isDarkTheme
              ? const InvertionFilter(
                  child: SaturationFilter(
                    saturation: -1,
                    child: BrightnessFilter(
                      brightness: -5,
                      child: image,
                    ),
                  ),
                )
              : image,
          const SizedBox(height: 20),
          Center(
            child: Text(
              "map_zoom_to_see_photos".tr(),
              style: context.textTheme.displayLarge?.copyWith(fontSize: 18),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapSheetDragRegion extends StatelessWidget {
  final ScrollController controller;
  final int assetsInBoundCount;
  final ValueNotifier<String?> assetInSheet;
  final Function(String)? onZoomToAsset;

  const _MapSheetDragRegion({
    required this.controller,
    required this.assetsInBoundCount,
    required this.assetInSheet,
    this.onZoomToAsset,
  });

  @override
  Widget build(BuildContext context) {
    final assetsInBoundsText = assetsInBoundCount > 0
        ? "map_assets_in_bounds".tr(args: [assetsInBoundCount.toString()])
        : "map_no_assets_in_bounds".tr();

    return SingleChildScrollView(
      controller: controller,
      physics: const ClampingScrollPhysics(),
      child: Card(
        margin: EdgeInsets.zero,
        shape: context.isMobile
            ? const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topRight: Radius.circular(20),
                  topLeft: Radius.circular(20),
                ),
              )
            : const BeveledRectangleBorder(),
        elevation: 0.0,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 15),
                const CustomDraggingHandle(),
                const SizedBox(height: 15),
                Text(assetsInBoundsText, style: context.textTheme.bodyLarge),
                const Divider(height: 35),
              ],
            ),
            ValueListenableBuilder(
              valueListenable: assetInSheet,
              builder: (_, value, __) => Visibility(
                visible: value != null,
                child: Positioned(
                  right: 15,
                  top: 15,
                  child: IconButton(
                    icon: Icon(
                      Icons.map_outlined,
                      color: context.textTheme.displayLarge?.color,
                    ),
                    iconSize: 20,
                    tooltip: 'Zoom to bounds',
                    onPressed: () => onZoomToAsset?.call(value!),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
