import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/map/models/map_subscription_event.mode.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

class AssetsInBoundBottomSheet extends StatefulHookConsumerWidget {
  final StreamController bottomSheetEventSC;
  final Stream mapPageEventStream;
  final DraggableScrollableController? scrollableController;

  const AssetsInBoundBottomSheet(
    this.mapPageEventStream,
    this.bottomSheetEventSC, {
    super.key,
    this.scrollableController,
  });

  @override
  AssetsInBoundBottomSheetState createState() =>
      AssetsInBoundBottomSheetState();
}

class AssetsInBoundBottomSheetState
    extends ConsumerState<AssetsInBoundBottomSheet> {
  // State variables
  late final StreamSubscription<dynamic> subscription;
  RenderList? _cachedRenderList;
  List<Asset> assetsInBound = [];
  late final Debounce debounceListUpdated;
  bool hasUserScrolledSheet = false;
  bool didUserTapOnMap = false;
  int assetOffsetInBottomSheet = -1;

  @override
  void initState() {
    super.initState();
    subscription = widget.mapPageEventStream.listen((event) {
      if (event is MapPageAssetsInBoundUpdated) {
        if (mounted) {
          setState(() {
            assetsInBound = event.assets;
          });
        }
      }
      if (event is MapPageOnTapEvent) {
        if (mounted) {
          setState(() {
            hasUserScrolledSheet = false;
            didUserTapOnMap = true;
            assetOffsetInBottomSheet = -1;
          });
        }
      }
    });
    debounceListUpdated = Debounce(
      const Duration(milliseconds: 100),
    );
  }

  @override
  void dispose() {
    super.dispose();
    subscription.cancel();
  }

  void _visibleItemsListener(ItemPosition start, ItemPosition end) {
    final renderElement = _cachedRenderList?.elements[start.index];
    if (renderElement == null) {
      return;
    }
    if ((-start.itemLeadingEdge) != 0) {
      var assetRowOffset = -start.itemLeadingEdge ~/ 0.05;
      assetRowOffset = assetRowOffset < renderElement.totalCount
          ? assetRowOffset
          : renderElement.totalCount - 1;
      final asset =
          _cachedRenderList?.allAssets?[renderElement.offset + assetRowOffset];
      if (!didUserTapOnMap) {
        widget.bottomSheetEventSC.add(
          MapPageBottomSheetScrolled(asset),
        );
      }
      setState(() {
        hasUserScrolledSheet = true;
        didUserTapOnMap = false;
      });
    }
  }

  void visibleItemsListener(ItemPosition start, ItemPosition end) {
    if (_cachedRenderList == null) {
      debounceListUpdated.dispose();
      return;
    }
    debounceListUpdated.call(() => _visibleItemsListener(start, end));
  }

  @override
  Widget build(BuildContext context) {
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final sheetExpanded = useState(false);

    useEffect(
      () {
        sheetExpandedCallback() {
          if (sheetExpanded.value == false) {
            setState(() {
              hasUserScrolledSheet = false;
              didUserTapOnMap = true;
              assetOffsetInBottomSheet = -1;
            });
          }
        }

        sheetExpanded.addListener(sheetExpandedCallback);
        return () => sheetExpanded.removeListener(sheetExpandedCallback);
      },
      [],
    );

    Widget buildNoPhotosWidget() {
      const image = Image(
        image: AssetImage('assets/lighthouse.png'),
      );

      return sheetExpanded.value
          ? Column(
              children: [
                const SizedBox(
                  height: 80,
                ),
                SizedBox(
                  height: 150,
                  width: 150,
                  child: isDarkMode
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
                  "Zoom out to see photos",
                  style: TextStyle(
                    fontSize: 20,
                    color: Theme.of(context).textTheme.displayLarge?.color,
                  ),
                ),
              ],
            )
          : const SizedBox.shrink();
    }

    Widget buildDragHandle(ScrollController scrollController) {
      final textToDisplay = assetsInBound.isNotEmpty
          ? "${assetsInBound.length} photo${assetsInBound.length > 1 ? "s" : ""}"
          : "No photos in this area";
      final dragHandle = Container(
        height: 75,
        width: double.infinity,
        decoration: BoxDecoration(
          color: isDarkMode ? Colors.grey[900] : Colors.grey[100],
        ),
        child: Stack(
          children: [
            Column(
              children: [
                const SizedBox(height: 12),
                const CustomDraggingHandle(),
                const SizedBox(height: 12),
                Text(
                  textToDisplay,
                  style: TextStyle(
                    fontSize: 16,
                    color: Theme.of(context).textTheme.displayLarge?.color,
                  ),
                ),
                Divider(
                  color: Theme.of(context)
                      .textTheme
                      .displayLarge
                      ?.color
                      ?.withOpacity(0.5),
                ),
              ],
            ),
            if (sheetExpanded.value && hasUserScrolledSheet)
              Positioned(
                top: 5,
                right: 10,
                child: IconButton(
                  icon: Icon(
                    Icons.map_outlined,
                    color: Theme.of(context).textTheme.displayLarge?.color,
                  ),
                  iconSize: 20,
                  tooltip: 'Zoom to bounds',
                  onPressed: () {},
                ),
              )
          ],
        ),
      );
      return SingleChildScrollView(
        controller: scrollController,
        child: dragHandle,
      );
    }

    return NotificationListener<DraggableScrollableNotification>(
      onNotification: (DraggableScrollableNotification notification) {
        sheetExpanded.value = notification.extent > 0.2;
        return true;
      },
      child: DraggableScrollableSheet(
        controller: widget.scrollableController,
        initialChildSize: 0.1,
        minChildSize: 0.1,
        maxChildSize: 0.55,
        snap: true,
        builder: (
          BuildContext context,
          ScrollController scrollController,
        ) {
          return Card(
            color: isDarkMode ? Colors.grey[900] : Colors.grey[100],
            surfaceTintColor: Colors.transparent,
            elevation: 18.0,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            margin: const EdgeInsets.all(0),
            child: Column(
              children: [
                buildDragHandle(scrollController),
                if (assetsInBound.isNotEmpty)
                  ref
                      .watch(
                        renderListProvider(
                          assetsInBound,
                        ),
                      )
                      .when(
                        data: (renderList) {
                          _cachedRenderList = renderList;
                          final assetGrid = ImmichAssetGrid(
                            shrinkWrap: true,
                            renderList: renderList,
                            showDragScroll: false,
                            visibleItemsListener: visibleItemsListener,
                          );

                          return Expanded(
                            child: sheetExpanded.value
                                ? assetGrid
                                : const SizedBox.shrink(),
                          );
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
                if (assetsInBound.isEmpty)
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
    );
  }
}
