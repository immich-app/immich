import 'dart:developer';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:openapi/api.dart';

class TopControlAppBar extends ConsumerWidget with PreferredSizeWidget {
  const TopControlAppBar({
    Key? key,
    required this.asset,
    required this.onMoreInfoPressed,
    required this.onDownloadPressed,
    required this.onSharePressed,
    this.loading = false
  }) : super(key: key);

  final AssetResponseDto asset;
  final Function onMoreInfoPressed;
  final Function onDownloadPressed;
  final Function onSharePressed;
  final bool loading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    double iconSize = 18.0;

    return AppBar(
      foregroundColor: Colors.grey[100],
      toolbarHeight: 60,
      backgroundColor: Colors.black,
      leading: IconButton(
        onPressed: () {
          AutoRouter.of(context).pop();
        },
        icon: const Icon(
          Icons.arrow_back_ios_new_rounded,
          size: 20.0,
        ),
      ),
      actions: [
        if (loading) Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 15.0),
            width: iconSize,
            height: iconSize,
            child: const CircularProgressIndicator(strokeWidth: 2.0),
          ),
        ) ,
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onDownloadPressed();
          },
          icon: const Icon(Icons.cloud_download_rounded),
        ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            log("favorite");
          },
          icon: asset.isFavorite
              ? const Icon(Icons.favorite_rounded)
              : const Icon(Icons.favorite_border_rounded),
        ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onSharePressed();
          },
          icon: const Icon(Icons.share),
        ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onMoreInfoPressed();
          },
          icon: const Icon(Icons.more_horiz_rounded),
        )
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
