import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class CircleAvatarPeople extends HookConsumerWidget {
  const CircleAvatarPeople({
    super.key,
    required this.personId,
    this.maxRadius = 50,
    this.imageSize = 100,
  });

  final String personId;
  final double maxRadius;
  final double imageSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CircleAvatar(
      maxRadius: maxRadius,
      child: ClipRRect(
        borderRadius: const BorderRadius.all(Radius.circular(100)),
        child: CachedNetworkImage(
          width: imageSize,
          height: imageSize,
          fit: BoxFit.contain,
          imageUrl: getFaceThumbnailUrl(personId),
          httpHeaders: ApiService.getRequestHeaders(),
        ),
      ),
    );
  }
}
