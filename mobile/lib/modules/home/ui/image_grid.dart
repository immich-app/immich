import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_image_sort_info.model.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:openapi/api.dart';

// ignore: must_be_immutable
class ImageGrid extends ConsumerWidget {
  final List<AssetResponseDto> assetGroup;

  ImageGrid({Key? key, required this.assetGroup}) : super(key: key);

  List<AssetResponseDto> imageSortedList = [];
  var box = Hive.box<HiveSavedImageSortInfo>(hiveImageSortInfoBox);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var assetGroupByDateTime = ref.watch(assetGroupByDateTimeProvider);
    // set sorted List
    for (var group in assetGroupByDateTime.values) {
      for (var value in group) {
        imageSortedList.add(value);
      }
    }

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
                ThumbnailImage(
                  asset: assetGroup[index],
                  assetList: imageSortedList,
                ),
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
