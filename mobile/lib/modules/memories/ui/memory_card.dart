import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class MemoryCard extends HookConsumerWidget {
  final Asset asset;
  final void Function() onTap;
  final void Function() onClose;
  final String title;
  final String? rightCornerText;
  final bool showTitle;

  const MemoryCard({
    required this.asset,
    required this.onTap,
    required this.onClose,
    required this.title,
    required this.showTitle,
    this.rightCornerText,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authToken = 'Bearer ${Store.get(StoreKey.accessToken)}';

    buildTitle() {
      return Text(
        title,
        style: context.textTheme.headlineMedium?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
      );
    }

    return Card(
      color: Colors.black,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(25.0),
        side: const BorderSide(
          color: Colors.black,
          width: 1.0,
        ),
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: CachedNetworkImageProvider(
                    getThumbnailUrl(
                      asset,
                    ),
                    cacheKey: getThumbnailCacheKey(
                      asset,
                    ),
                    headers: {"Authorization": authToken},
                  ),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(color: Colors.black.withOpacity(0.2)),
            ),
          ),
          GestureDetector(
            onTap: onTap,
            child: ImmichImage(
              asset,
              fit: BoxFit.fitWidth,
              height: double.infinity,
              width: double.infinity,
              type: ThumbnailFormat.JPEG,
              preferredLocalAssetSize: 2048,
            ),
          ),
          Positioned(
            top: 2.0,
            left: 2.0,
            child: IconButton(
              onPressed: onClose,
              icon: const Icon(Icons.close_rounded),
              color: Colors.grey[400],
            ),
          ),
          Positioned(
            right: 18.0,
            top: 18.0,
            child: Text(
              rightCornerText ?? "",
              style: TextStyle(
                color: Colors.grey[200],
                fontSize: 12.0,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          if (showTitle)
            Positioned(
              left: 18.0,
              bottom: 18.0,
              child: buildTitle(),
            ),
        ],
      ),
    );
  }
}
