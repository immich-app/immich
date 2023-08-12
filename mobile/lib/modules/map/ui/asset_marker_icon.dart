import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class AssetMarkerIcon extends StatelessWidget {
  const AssetMarkerIcon({
    Key? key,
    required this.id,
  }) : super(key: key);

  final String id;

  @override
  Widget build(BuildContext context) {
    final imageUrl = getThumbnailUrlForRemoteId(id);
    final cacheKey = getThumbnailCacheKeyForRemoteId(id);
    final ThemeData theme = Theme.of(context);
    return CircleAvatar(
      backgroundColor: theme.colorScheme.onPrimary,
      child: CircleAvatar(
        radius: 35,
        backgroundImage: CachedNetworkImageProvider(
          imageUrl,
          cacheKey: cacheKey,
          headers: {
            "Authorization": "Bearer ${Store.get(StoreKey.accessToken)}"
          },
          errorListener: () => const Icon(Icons.image_not_supported_outlined),
        ),
      ),
    );
  }
}
