import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/widgets/common/transparent_image.dart';

class DriftUserCircleAvatar extends ConsumerWidget {
  final User user;
  final double radius;
  final double size;
  final bool hasBorder;

  const DriftUserCircleAvatar({
    super.key,
    this.radius = 22,
    this.size = 44,
    this.hasBorder = false,
    required this.user,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: migrate to default user avatar
    final userAvatarColor = user.avatarColor?.toColor() ?? AvatarColor.amber.toColor();
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/${user.id}/profile-image?d=${Random().nextInt(1024)}';

    final textIcon = DefaultTextStyle(
      style: TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 12,
        color: userAvatarColor.computeLuminance() > 0.5 ? Colors.black : Colors.white,
      ),
      child: Text(user.name[0].toUpperCase()),
    );
    return Tooltip(
      message: user.name,
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: hasBorder
              ? Border.all(
                  color: Colors.grey[500]!,
                  width: 1,
                )
              : null,
        ),
        child: CircleAvatar(
          backgroundColor: userAvatarColor,
          radius: radius,
          child: textIcon,
          // TODO: Migrate to auth user
          // child: user.hasProfileImage
          //     ? ClipRRect(
          //         borderRadius: const BorderRadius.all(Radius.circular(50)),
          //         child: CachedNetworkImage(
          //           fit: BoxFit.cover,
          //           cacheKey: profileImageUrl,
          //           width: size,
          //           height: size,
          //           placeholder: (_, __) => Image.memory(kTransparentImage),
          //           imageUrl: profileImageUrl,
          //           httpHeaders: ApiService.getRequestHeaders(),
          //           fadeInDuration: const Duration(milliseconds: 300),
          //           errorWidget: (context, error, stackTrace) => textIcon,
          //         ),
          //       )
          //     : textIcon,
        ),
      ),
    );
  }
}
