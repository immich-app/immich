import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/widgets/common/transparent_image.dart';

// ignore: must_be_immutable
class UserCircleAvatar extends ConsumerWidget {
  final UserDto user;
  double radius;
  double size;

  UserCircleAvatar({
    super.key,
    this.radius = 22,
    this.size = 44,
    required this.user,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAvatarColor = user.avatarColor.toColor();
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/${user.id}/profile-image?d=${Random().nextInt(1024)}';

    final textIcon = DefaultTextStyle(
      style: TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 12,
        color: userAvatarColor.computeLuminance() > 0.5
            ? Colors.black
            : Colors.white,
      ),
      child: Text(user.name[0].toUpperCase()),
    );
    return CircleAvatar(
      backgroundColor: userAvatarColor,
      radius: radius,
      child: user.profileImagePath == null
          ? textIcon
          : ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(50)),
              child: CachedNetworkImage(
                fit: BoxFit.cover,
                cacheKey: user.profileImagePath,
                width: size,
                height: size,
                placeholder: (_, __) => Image.memory(kTransparentImage),
                imageUrl: profileImageUrl,
                httpHeaders: ApiService.getRequestHeaders(),
                fadeInDuration: const Duration(milliseconds: 300),
                errorWidget: (context, error, stackTrace) => textIcon,
              ),
            ),
    );
  }
}
