import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/map/providers/map_marker.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';

class AssetsInBoundBottomSheet extends StatefulHookConsumerWidget {
  final Stream assetMarkersInBoundStream;

  const AssetsInBoundBottomSheet(this.assetMarkersInBoundStream, {super.key});

  @override
  AssetsInBoundBottomSheetState createState() =>
      AssetsInBoundBottomSheetState();
}

class AssetsInBoundBottomSheetState
    extends ConsumerState<AssetsInBoundBottomSheet> {
  // State variables
  late final StreamSubscription<dynamic> subscription;
  List<Asset> assetsInBound = [];

  @override
  void initState() {
    super.initState();
    subscription = widget.assetMarkersInBoundStream.listen((event) {
      if (mounted) {
        setState(() {
          assetsInBound = event;
        });
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    subscription.cancel();
  }

  @override
  Widget build(BuildContext context) {
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;

    Widget buildNoPhotosWidget() {
      const image = Image(
        image: AssetImage('assets/lighthouse.png'),
      );

      return Column(
        children: [
          const SizedBox(
            height: 100,
          ),
          SizedBox(
            height: 160,
            width: 160,
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
            "No Photos In Area",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).textTheme.displayLarge?.color,
            ),
          ),
        ],
      );
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.18,
      minChildSize: 0.18,
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
          child: Stack(
            children: [
              CustomScrollView(
                controller: scrollController,
                slivers: [
                  SliverToBoxAdapter(
                    child: Column(
                      children: <Widget>[
                        if (assetsInBound.isNotEmpty)
                          ref
                              .watch(
                                mapMarkerAssetsInBoundProvider(
                                  assetsInBound,
                                ),
                              )
                              .when(
                                data: (renderList) => ImmichAssetGrid(
                                  shrinkWrap: true,
                                  renderList: renderList,
                                ),
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
                        if (assetsInBound.isEmpty) buildNoPhotosWidget(),
                      ],
                    ),
                  ),
                ],
              ),
              IgnorePointer(
                child: Container(
                  height: 30,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: isDarkMode ? Colors.grey[900] : Colors.grey[100],
                  ),
                  child: const Column(
                    children: [
                      SizedBox(height: 12),
                      CustomDraggingHandle(),
                      SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
