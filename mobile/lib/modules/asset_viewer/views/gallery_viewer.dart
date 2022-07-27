import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_swipe_detector/flutter_swipe_detector.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/remote_photo_view.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:openapi/api.dart';

class GalleryViewerPage extends HookConsumerWidget {
  final List<AssetResponseDto> assetList;
  final AssetResponseDto asset;
  final Box<dynamic> box;
  final String thumbnailRequestUrl;

  const GalleryViewerPage({
    Key? key,
    required this.assetList,
    required this.asset,
    required this.box,
    required this.thumbnailRequestUrl,
  }) : super(key: key);

  // @override
  // State<StatefulWidget> createState() => GalleryViewerPageState();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AssetResponseDto? assetDetail;
    int indexOfAsset = 0;
    PageController controller =
        PageController(initialPage: assetList.indexOf(asset));

    var downloadAssetStatus =
        ref.watch(imageViewerStateProvider).downloadAssetStatus;

    String jwtToken = Hive.box(userInfoBox).get(accessTokenKey);

    void showInfo() {
      showModalBottomSheet(
        backgroundColor: Colors.black,
        barrierColor: Colors.transparent,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return ExifBottomSheet(assetDetail: assetDetail!);
        },
      );
    }

    getAssetExif() async {
      assetDetail = await ref
          .watch(assetServiceProvider)
          .getAssetById(assetList[indexOfAsset].id);
    }

    useEffect(
      () {
        getAssetExif();
        return null;
      },
      [],
    );
    @override
    void initState(int index) {
      indexOfAsset = index;
      getAssetExif();
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: TopControlAppBar(
        asset: assetList[indexOfAsset],
        onMoreInfoPressed: () {
          showInfo();
        },
        onDownloadPressed: () {
          ref
              .watch(imageViewerStateProvider.notifier)
              .downloadAsset(assetList[indexOfAsset], context);
        },
      ),
      body: SwipeDetector(
        onSwipeDown: (_) {
          AutoRouter.of(context).pop();
        },
        onSwipeUp: (_) {
          showInfo();
        },
        child: SafeArea(
          child: PageView.builder(
            controller: controller,
            pageSnapping: true,
            physics: const BouncingScrollPhysics(),
            itemCount: assetList.length,
            scrollDirection: Axis.horizontal,
            itemBuilder: (context, index) {
              initState(index);
              // ignore: avoid_print
              print("looking at $indexOfAsset");
              if (assetList[index].type == AssetTypeEnum.IMAGE) {
                return RemotePhotoView(
                  thumbnailUrl:
                      '${box.get(serverEndpointKey)}/asset/thumbnail/${assetList[index].id}',
                  imageUrl:
                      '${box.get(serverEndpointKey)}/asset/file?aid=${assetList[index].deviceAssetId}&did=${assetList[index].deviceId}&isThumb=false',
                  authToken: "Bearer ${box.get(accessTokenKey)}",
                  onSwipeDown: () => AutoRouter.of(context).pop(),
                  onSwipeUp: () => showInfo(),
                );
              } else {
                return VideoThumbnailPlayer(
                  url:
                      '${box.get(serverEndpointKey)}/asset/file?aid=${assetList[index].deviceAssetId}&did=${assetList[index].deviceId}',
                  jwtToken: jwtToken,
                );
              }
            },
          ),
        ),
      ),
    );
  }
}
