import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class CirclePeopleAvatar extends HookConsumerWidget {
  const CirclePeopleAvatar({
    super.key,
    required this.personId,
    this.imageSize = 100,
  });

  final String personId;
  final int imageSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final imageUrl = getFaceThumbnailUrl(personId);

    return CircleAvatar(
      maxRadius: imageSize / 2,
      foregroundImage: CachedNetworkImageProvider(
        imageUrl,
        cacheKey: imageUrl,
        maxWidth: imageSize,
        maxHeight: imageSize,
        headers: ApiService.getRequestHeaders(),
      ),
    );
  }
}
