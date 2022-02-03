import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';

class ImageViewerPage extends StatelessWidget {
  final String imageUrl;
  final String heroTag;
  final String thumbnailUrl;

  const ImageViewerPage({Key? key, required this.imageUrl, required this.heroTag, required this.thumbnailUrl})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    var box = Hive.box(userInfoBox);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        toolbarHeight: 60,
        backgroundColor: Colors.black,
        leading: IconButton(
            onPressed: () {
              AutoRouter.of(context).pop();
            },
            icon: const Icon(Icons.arrow_back_ios)),
      ),
      body: Dismissible(
        direction: DismissDirection.vertical,
        onDismissed: (_) {
          AutoRouter.of(context).pop();
        },
        key: Key(heroTag),
        child: Center(
          child: Hero(
            tag: heroTag,
            child: CachedNetworkImage(
              fit: BoxFit.cover,
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
    );
  }
}
