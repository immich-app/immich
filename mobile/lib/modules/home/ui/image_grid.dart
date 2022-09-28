import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:openapi/api.dart';

// ignore: must_be_immutable
class ImageGrid extends ConsumerWidget {
  final List<AssetResponseDto> assetGroup;
  final List<AssetResponseDto> sortedAssetGroup;
  final int tilesPerRow;
  final bool showStorageIndicator;

  ImageGrid({
    Key? key,
    required this.assetGroup,
    required this.sortedAssetGroup,
    this.tilesPerRow = 4,
    this.showStorageIndicator = true,
  }) : super(key: key);

  List<AssetResponseDto> imageSortedList = [];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverGrid(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: tilesPerRow,
        crossAxisSpacing: 5.0,
        mainAxisSpacing: 5,
      ),
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          var assetType = assetGroup[index].type;
          return GestureDetector(
            onTap: () {},
            child: ThumbnailImage(
              asset: assetGroup[index],
              assetList: sortedAssetGroup,
              showStorageIndicator: showStorageIndicator,
            ),
          );
        },
        childCount: assetGroup.length,
      ),
    );
  }
}
