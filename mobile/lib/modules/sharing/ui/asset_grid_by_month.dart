import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/ui/selection_thumbnail_image.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetGridByMonth extends HookConsumerWidget {
  final List<ImmichAsset> assetGroup;
  const AssetGridByMonth({Key? key, required this.assetGroup}) : super(key: key);
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

          return Stack(
            children: [
              SelectionThumbnailImage(asset: assetGroup[index]),
              assetType == 'IMAGE'
                  ? Container()
                  : Positioned(
                      bottom: 5,
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
                    )
            ],
          );
        },
        childCount: assetGroup.length,
      ),
    );
  }
}
