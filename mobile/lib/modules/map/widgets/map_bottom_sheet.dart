import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/map/map_event.model.dart';
import 'package:immich_mobile/modules/map/widgets/map_asset_grid.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/utils/draggable_scroll_controller.dart';

class MapBottomSheet extends HookConsumerWidget {
  final Stream<MapEvent> mapEventStream;
  final Function(String)? onGridAssetChanged;
  final Function(String)? onZoomToAsset;
  final Function()? onZoomToLocation;
  final Function(bool, Set<Asset>)? onAssetsSelected;
  final ValueNotifier<Set<Asset>> selectedAssets;

  const MapBottomSheet({
    required this.mapEventStream,
    this.onGridAssetChanged,
    this.onZoomToAsset,
    this.onAssetsSelected,
    this.onZoomToLocation,
    required this.selectedAssets,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const sheetMinExtent = 0.1;
    final sheetController = useDraggableScrollController();
    final bottomSheetOffset = useValueNotifier(sheetMinExtent);
    final isBottomSheetOpened = useRef(false);

    void handleMapEvents(MapEvent event) async {
      if (event is MapCloseBottomSheet) {
        sheetController.animateTo(
          0.1,
          duration: const Duration(milliseconds: 200),
          curve: Curves.linearToEaseOut,
        );
      }
    }

    useOnStreamChange<MapEvent>(mapEventStream, onData: handleMapEvents);

    bool onScrollNotification(DraggableScrollableNotification notification) {
      isBottomSheetOpened.value =
          notification.extent > (notification.maxExtent * 0.9);
      bottomSheetOffset.value = notification.extent;
      // do not bubble
      return true;
    }

    return Stack(
      children: [
        NotificationListener<DraggableScrollableNotification>(
          onNotification: onScrollNotification,
          child: DraggableScrollableSheet(
            controller: sheetController,
            minChildSize: sheetMinExtent,
            maxChildSize: 0.5,
            initialChildSize: sheetMinExtent,
            snap: true,
            shouldCloseOnMinExtent: false,
            builder: (ctx, scrollController) => MapAssetGrid(
              controller: scrollController,
              mapEventStream: mapEventStream,
              selectedAssets: selectedAssets,
              onAssetsSelected: onAssetsSelected,
              // Do not bother with the event if the bottom sheet is not user scrolled
              onGridAssetChanged: (assetId) => isBottomSheetOpened.value
                  ? onGridAssetChanged?.call(assetId)
                  : null,
              onZoomToAsset: onZoomToAsset,
            ),
          ),
        ),
        ValueListenableBuilder(
          valueListenable: bottomSheetOffset,
          builder: (ctx, value, child) => Positioned(
            right: 0,
            bottom: context.height * (value + 0.02),
            child: child!,
          ),
          child: ElevatedButton(
            onPressed: onZoomToLocation,
            style: ElevatedButton.styleFrom(
              shape: const CircleBorder(),
            ),
            child: const Icon(Icons.my_location),
          ),
        ),
      ],
    );
  }
}
