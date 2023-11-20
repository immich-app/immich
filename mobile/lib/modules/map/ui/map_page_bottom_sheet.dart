import 'dart:async';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid_view.dart';
import 'package:immich_mobile/modules/map/models/map_page_event.model.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

class MapPageBottomSheet extends StatefulHookConsumerWidget {
  final Stream mapPageEventStream;
  final StreamController bottomSheetEventSC;
  final bool selectionEnabled;
  final ImmichAssetGridSelectionListener selectionlistener;
  final bool isDarkTheme;

  const MapPageBottomSheet({
    super.key,
    required this.mapPageEventStream,
    required this.bottomSheetEventSC,
    required this.selectionEnabled,
    required this.selectionlistener,
    this.isDarkTheme = false,
  });

  @override
  AssetsInBoundBottomSheetState createState() =>
      AssetsInBoundBottomSheetState();
}

class AssetsInBoundBottomSheetState extends ConsumerState<MapPageBottomSheet> {
  // Non-State variables
  bool userTappedOnMap = false;
  RenderList? _cachedRenderList;
  int assetOffsetInSheet = -1;
  late final DraggableScrollableController bottomSheetController;
  late final Debounce debounce;

  @override
  void initState() {
    super.initState();
    bottomSheetController = DraggableScrollableController();
    debounce = Debounce(
      const Duration(milliseconds: 100),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDarkTheme = context.isDarkTheme;
    final bottomPadding =
        Platform.isAndroid ? MediaQuery.of(context).padding.bottom - 10 : 0.0;
    final maxHeight = context.height - bottomPadding;
    final isSheetScrolled = useState(false);
    final isSheetExpanded = useState(false);
    final assetsInBound = useState(<Asset>[]);
    final currentExtend = useState(0.1);

    void handleMapPageEvents(dynamic event) {
      if (event is MapPageAssetsInBoundUpdated) {
        assetsInBound.value = event.assets;
      } else if (event is MapPageOnTapEvent) {
        userTappedOnMap = true;
        assetOffsetInSheet = -1;
        bottomSheetController.animateTo(
          0.1,
          duration: const Duration(milliseconds: 200),
          curve: Curves.linearToEaseOut,
        );
        isSheetScrolled.value = false;
      }
    }

    useEffect(
      () {
        final mapPageEventSubscription =
            widget.mapPageEventStream.listen(handleMapPageEvents);
        return mapPageEventSubscription.cancel;
      },
      [widget.mapPageEventStream],
    );

    void handleVisibleItems(ItemPosition start, ItemPosition end) {
      final renderElement = _cachedRenderList?.elements[start.index];
      if (renderElement == null) {
        return;
      }
      final rowOffset = renderElement.offset;
      if ((-start.itemLeadingEdge) != 0) {
        var columnOffset = -start.itemLeadingEdge ~/ 0.05;
        columnOffset = columnOffset < renderElement.totalCount
            ? columnOffset
            : renderElement.totalCount - 1;
        assetOffsetInSheet = rowOffset + columnOffset;
        final asset = _cachedRenderList?.allAssets?[assetOffsetInSheet];
        userTappedOnMap = false;
        if (!userTappedOnMap && isSheetExpanded.value) {
          widget.bottomSheetEventSC.add(
            MapPageBottomSheetScrolled(asset),
          );
        }
        if (isSheetExpanded.value) {
          isSheetScrolled.value = true;
        }
      }
    }

    void visibleItemsListener(ItemPosition start, ItemPosition end) {
      if (_cachedRenderList == null) {
        debounce.dispose();
        return;
      }
      debounce.call(() => handleVisibleItems(start, end));
    }

    Widget buildNoPhotosWidget() {
      const image = Image(
        image: AssetImage('assets/lighthouse.png'),
      );

      return isSheetExpanded.value
          ? Column(
              children: [
                const SizedBox(
                  height: 80,
                ),
                SizedBox(
                  height: 150,
                  width: 150,
                  child: isDarkTheme
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
                ),
                const SizedBox(
                  height: 20,
                ),
                Text(
                  "map_zoom_to_see_photos".tr(),
                  style: TextStyle(
                    fontSize: 20,
                    color: context.textTheme.displayLarge?.color,
                  ),
                ),
              ],
            )
          : const SizedBox.shrink();
    }

    void onTapMapButton() {
      if (assetOffsetInSheet != -1) {
        widget.bottomSheetEventSC.add(
          MapPageZoomToAsset(
            _cachedRenderList?.allAssets?[assetOffsetInSheet],
          ),
        );
      }
    }

    Widget buildDragHandle(ScrollController scrollController) {
      final textToDisplay = assetsInBound.value.isNotEmpty
          ? "map_assets_in_bounds".plural(assetsInBound.value.length)
          : "map_no_assets_in_bounds".tr();
      final dragHandle = Container(
        height: 70,
        width: double.infinity,
        decoration: BoxDecoration(
          color: isDarkTheme ? Colors.grey[900] : Colors.grey[100],
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 5),
                const CustomDraggingHandle(),
                const SizedBox(height: 15),
                Text(
                  textToDisplay,
                  style: context.textTheme.bodyLarge,
                ),
                Divider(
                  height: 10,
                  color:
                      context.textTheme.displayLarge?.color?.withOpacity(0.5),
                ),
              ],
            ),
            if (isSheetExpanded.value && isSheetScrolled.value)
              Positioned(
                top: 5,
                right: 10,
                child: IconButton(
                  icon: Icon(
                    Icons.map_outlined,
                    color: context.textTheme.displayLarge?.color,
                  ),
                  iconSize: 20,
                  tooltip: 'Zoom to bounds',
                  onPressed: onTapMapButton,
                ),
              ),
          ],
        ),
      );
      return SingleChildScrollView(
        controller: scrollController,
        physics: const ClampingScrollPhysics(),
        child: dragHandle,
      );
    }

    return NotificationListener<DraggableScrollableNotification>(
      onNotification: (DraggableScrollableNotification notification) {
        final sheetExtended = notification.extent > 0.2;
        isSheetExpanded.value = sheetExtended;
        currentExtend.value = notification.extent;
        if (!sheetExtended) {
          // reset state
          userTappedOnMap = false;
          assetOffsetInSheet = -1;
          isSheetScrolled.value = false;
        }

        return true;
      },
      child: Padding(
        padding: EdgeInsets.only(
          bottom: bottomPadding,
        ),
        child: Stack(
          children: [
            DraggableScrollableSheet(
              controller: bottomSheetController,
              initialChildSize: 0.1,
              minChildSize: 0.1,
              maxChildSize: 0.55,
              snap: true,
              builder: (
                BuildContext context,
                ScrollController scrollController,
              ) {
                return Card(
                  color: isDarkTheme ? Colors.grey[900] : Colors.grey[100],
                  surfaceTintColor: Colors.transparent,
                  elevation: 18.0,
                  margin: const EdgeInsets.all(0),
                  child: Column(
                    children: [
                      buildDragHandle(scrollController),
                      if (isSheetExpanded.value &&
                          assetsInBound.value.isNotEmpty)
                        ref
                            .watch(
                              renderListProvider(
                                assetsInBound.value,
                              ),
                            )
                            .when(
                              data: (renderList) {
                                _cachedRenderList = renderList;
                                final assetGrid = ImmichAssetGrid(
                                  shrinkWrap: true,
                                  renderList: renderList,
                                  showDragScroll: false,
                                  selectionActive: widget.selectionEnabled,
                                  showMultiSelectIndicator: false,
                                  listener: widget.selectionlistener,
                                  visibleItemsListener: visibleItemsListener,
                                );

                                return Expanded(child: assetGrid);
                              },
                              error: (error, stackTrace) {
                                log.warning(
                                  "Cannot get assets in the current map bounds ${error.toString()}",
                                  error,
                                  stackTrace,
                                );
                                return const SizedBox.shrink();
                              },
                              loading: () => const SizedBox.shrink(),
                            ),
                      if (isSheetExpanded.value && assetsInBound.value.isEmpty)
                        Expanded(
                          child: SingleChildScrollView(
                            child: buildNoPhotosWidget(),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
            Positioned(
              bottom: maxHeight * currentExtend.value,
              left: 0,
              child: ColoredBox(
                color:
                    (widget.isDarkTheme ? Colors.grey[900] : Colors.grey[100])!,
                child: Padding(
                  padding: const EdgeInsets.all(3),
                  child: Text(
                    'OpenStreetMap contributors',
                    style: TextStyle(
                      fontSize: 6,
                      color: !widget.isDarkTheme
                          ? Colors.grey[900]
                          : Colors.grey[100],
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: maxHeight * (0.14 + (currentExtend.value - 0.1)),
              right: 15,
              child: ElevatedButton(
                onPressed: () => widget.bottomSheetEventSC
                    .add(const MapPageZoomToLocation()),
                style: ElevatedButton.styleFrom(
                  shape: const CircleBorder(),
                  padding: const EdgeInsets.all(12),
                ),
                child: const Icon(
                  Icons.my_location,
                  size: 22,
                  fill: 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
