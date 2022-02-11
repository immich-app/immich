import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/models/immich_asset_with_exif.model.dart';
import 'package:photo_view/photo_view.dart';

// ignore: must_be_immutable
class ImageViewerPage extends HookConsumerWidget {
  final String imageUrl;
  final String heroTag;
  final String thumbnailUrl;
  final ImmichAsset asset;
  final AssetService _assetService = AssetService();
  ImmichAssetWithExif? assetDetail;

  ImageViewerPage(
      {Key? key, required this.imageUrl, required this.heroTag, required this.thumbnailUrl, required this.asset})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);

    getAssetExif() async {
      assetDetail = await _assetService.getAssetById(asset.id);
    }

    useEffect(() {
      getAssetExif();
    }, []);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: TopControlAppBar(
        asset: asset,
        onMoreInfoPressed: () {
          showModalBottomSheet(
              backgroundColor: Colors.black,
              barrierColor: Colors.transparent,
              isScrollControlled: false,
              context: context,
              builder: (context) {
                return ExifBottomSheet(assetDetail: assetDetail!);
              });
        },
      ),
      body: Center(
        child: Hero(
          tag: heroTag,
          child: CachedNetworkImage(
            fit: BoxFit.cover,
            imageUrl: imageUrl,
            httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
            fadeInDuration: const Duration(milliseconds: 250),
            errorWidget: (context, url, error) => const Icon(Icons.error),
            imageBuilder: (context, imageProvider) {
              return PhotoView(imageProvider: imageProvider);
            },
            placeholder: (context, url) {
              return CachedNetworkImage(
                fit: BoxFit.cover,
                imageUrl: thumbnailUrl,
                httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
                placeholderFadeInDuration: const Duration(milliseconds: 0),
                progressIndicatorBuilder: (context, url, downloadProgress) => Transform.scale(
                  scale: 0.2,
                  child: CircularProgressIndicator(value: downloadProgress.progress),
                ),
                errorWidget: (context, url, error) => const Icon(Icons.error),
              );
            },
          ),
        ),
      ),
    );
  }
}
