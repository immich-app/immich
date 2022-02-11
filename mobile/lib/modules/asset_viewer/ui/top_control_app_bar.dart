import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class TopControlAppBar extends StatelessWidget with PreferredSizeWidget {
  const TopControlAppBar({Key? key, required this.asset, required this.onMoreInfoPressed}) : super(key: key);

  final ImmichAsset asset;
  final Function onMoreInfoPressed;
  @override
  Widget build(BuildContext context) {
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
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            print("backup");
          },
          icon: const Icon(Icons.backup_outlined),
        ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            print("favorite");
          },
          icon: asset.isFavorite ? const Icon(Icons.favorite_rounded) : const Icon(Icons.favorite_border_rounded),
        ),
        IconButton(
            iconSize: iconSize,
            splashRadius: iconSize,
            onPressed: () {
              onMoreInfoPressed();
            },
            icon: const Icon(Icons.more_horiz_rounded))
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
