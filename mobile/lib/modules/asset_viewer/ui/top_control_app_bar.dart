import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class TopControlAppBar extends ConsumerWidget with PreferredSizeWidget {
  const TopControlAppBar({
    Key? key,
    required this.asset,
    required this.onMoreInfoPressed,
    required this.onDownloadPressed,
    required this.onSharePressed,
    this.loading = false,
  }) : super(key: key);

  final Asset asset;
  final Function onMoreInfoPressed;
  final VoidCallback? onDownloadPressed;
  final Function onSharePressed;
  final bool loading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    double iconSize = 18.0;

    return AppBar(
      foregroundColor: Colors.grey[100],
      toolbarHeight: 60,
      backgroundColor: Colors.transparent,
      leading: IconButton(
        onPressed: () {
          AutoRouter.of(context).pop();
        },
        icon: Icon(
          Icons.arrow_back_ios_new_rounded,
          size: 20.0,
          color: Colors.grey[200],
        ),
      ),
      actions: [
        if (loading)
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 15.0),
              width: iconSize,
              height: iconSize,
              child: const CircularProgressIndicator(strokeWidth: 2.0),
            ),
          ),
        if (!asset.isLocal)
          IconButton(
            iconSize: iconSize,
            splashRadius: iconSize,
            onPressed: onDownloadPressed,
            icon: Icon(
              Icons.cloud_download_rounded,
              color: Colors.grey[200],
            ),
          ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onSharePressed();
          },
          icon: Icon(
            Icons.share,
            color: Colors.grey[200],
          ),
        ),
        if (asset.isRemote)
          IconButton(
            iconSize: iconSize,
            splashRadius: iconSize,
            onPressed: () {
              onMoreInfoPressed();
            },
            icon: Icon(
              Icons.more_horiz_rounded,
              color: Colors.grey[200],
            ),
          )
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
