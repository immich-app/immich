import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:openapi/api.dart';

class ImageGrid extends ConsumerWidget {
  final List<AssetResponseDto> assetGroup;

  const ImageGrid({Key? key, required this.assetGroup}) : super(key: key);

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
          var assetType = assetGroup[index].type;

          return GestureDetector(
            onTap: () {},
            child: Stack(
              children: [
                ThumbnailImage(asset: assetGroup[index]),
                if (assetType != AssetTypeEnum.IMAGE)
                  Positioned(
                    top: 5,
                    right: 5,
                    child: Row(
                      children: [
                        Text(
                          assetGroup[index].duration.toString().substring(0, 7),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                          ),
                        ),
                        const Icon(
                          Icons.play_circle_outline_rounded,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
        childCount: assetGroup.length,
      ),
    );
  }
}
