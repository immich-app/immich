import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/models/immich_asset_with_exif.model.dart';

class ImageViewerPage extends HookConsumerWidget {
  final String imageUrl;
  final String heroTag;
  final String thumbnailUrl;
  final ImmichAsset asset;

  ImageViewerPage(
      {Key? key, required this.imageUrl, required this.heroTag, required this.thumbnailUrl, required this.asset})
      : super(key: key);

  final AssetService _assetService = AssetService();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);

    getDetail() async {
      var detail = await _assetService.getAssetById(asset.id);
    }

    useEffect(() {
      getDetail();
      return null;
    }, []);

    return Scaffold(
        backgroundColor: Colors.black,
        appBar: TopControlAppBar(
          asset: asset,
        ),
        body: Builder(
          builder: (context) {
            return ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 60),
                  child: Dismissible(
                    direction: DismissDirection.down,
                    onDismissed: (_) {
                      AutoRouter.of(context).pop();
                    },
                    movementDuration: const Duration(milliseconds: 5),
                    resizeDuration: const Duration(milliseconds: 5),
                    key: Key(heroTag),
                    child: GestureDetector(
                      child: Center(
                        child: Hero(
                          tag: heroTag,
                          child: CachedNetworkImage(
                            fit: BoxFit.fill,
                            imageUrl: imageUrl,
                            httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
                            fadeInDuration: const Duration(milliseconds: 250),
                            errorWidget: (context, url, error) => const Icon(Icons.error),
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
                    ),
                  ),
                ),
                Container(
                  decoration: const BoxDecoration(color: Colors.black),
                  width: MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height / 2,
                  child: Column(
                    children: [
                      Icon(
                        Icons.horizontal_rule_rounded,
                        color: Colors.grey[50],
                        size: 40,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ControlBoxButton(
                            iconData: Icons.delete_forever_rounded,
                            label: "Delete",
                            onPressed: () {},
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Divider(
                          endIndent: 10,
                          indent: 10,
                          thickness: 1,
                          color: Colors.grey[800],
                        ),
                      )
                    ],
                  ),
                ),
              ],
            );
          },
        ));
  }
}

class ControlBoxButton extends StatelessWidget {
  const ControlBoxButton({Key? key, required this.label, required this.iconData, required this.onPressed})
      : super(key: key);

  final String label;
  final IconData iconData;
  final Function onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 60,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          IconButton(
            onPressed: () {
              onPressed();
            },
            icon: Icon(
              iconData,
              size: 25,
              color: Colors.grey[50],
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 10, color: Colors.grey[50]),
          )
        ],
      ),
    );
  }
}
