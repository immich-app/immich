import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/widgets/common/transparent_image.dart';

// ignore: must_be_immutable
class UserCircleAvatar extends ConsumerWidget {
  final User user;
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
    bool isDarkTheme = context.themeData.brightness == Brightness.dark;
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/${user.id}/profile-image?d=${Random().nextInt(1024)}';

    final textIcon = Text(
      user.name[0].toUpperCase(),
      style: TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 12,
        color: isDarkTheme && user.avatarColor == AvatarColorEnum.primary
            ? Colors.black
            : Colors.white,
      ),
    );
    return CircleAvatar(
      backgroundColor: user.avatarColor.toColor(),
      radius: radius,
      child: user.profileImagePath.isEmpty
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
