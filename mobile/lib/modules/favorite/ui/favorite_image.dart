import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class FavoriteImage extends HookConsumerWidget {
  final Asset asset;
  final Function()? onTap;

  const FavoriteImage({
    super.key,
    required this.asset,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      child: Hero(
        tag: asset.id,
        child: ImmichImage(
          asset,
          width: 300,
          height: 300,
        ),
      ),
    );
  }

}
