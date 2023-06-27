import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class MemoryCard extends HookConsumerWidget {
  final Asset asset;
  const MemoryCard({required this.asset, super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authToken = 'Bearer ${Store.get(StoreKey.accessToken)}';

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(25.0),
        side: BorderSide.none,
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          Container(
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
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
              child: Container(
                decoration:
                    BoxDecoration(color: Colors.black.withOpacity(0.25)),
              ),
            ),
          ),
          ImmichImage(
            asset,
            fit: BoxFit.fitWidth,
            height: double.infinity,
            width: double.infinity,
            type: ThumbnailFormat.JPEG,
          ),
        ],
      ),
    );
  }
}
