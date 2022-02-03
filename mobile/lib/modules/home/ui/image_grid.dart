import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class ImageGrid extends StatelessWidget {
  final List<ImmichAsset> assetGroup;

  const ImageGrid({Key? key, required this.assetGroup}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SliverGrid(
      gridDelegate:
          const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 5.0, mainAxisSpacing: 5),
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          return GestureDetector(
            onTap: () {},
            child: ThumbnailImage(asset: assetGroup[index]),
          );
        },
        childCount: assetGroup.length,
      ),
    );
  }
}
