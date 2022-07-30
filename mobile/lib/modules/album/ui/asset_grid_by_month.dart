import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/ui/selection_thumbnail_image.dart';
import 'package:openapi/api.dart';

class AssetGridByMonth extends HookConsumerWidget {
  final List<AssetResponseDto> assetGroup;
  const AssetGridByMonth({Key? key, required this.assetGroup})
      : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 5.0,
        mainAxisSpacing: 5,
      ),
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          return SelectionThumbnailImage(asset: assetGroup[index]);
        },
        childCount: assetGroup.length,
      ),
    );
  }
}
