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
  double size;
  bool hasBorder;
  double opacity;

  UserCircleAvatar({super.key, this.size = 44, this.hasBorder = false, this.opacity = 1, required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAvatarColor = user.avatarColor.toColor().withValues(alpha: opacity);
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/${user.id}/profile-image?d=${Random().nextInt(1024)}';

    final textColor = (user.avatarColor.toColor().computeLuminance() > 0.5 ? Colors.black : Colors.white).withValues(
      alpha: opacity,
    );

    final textIcon = DefaultTextStyle(
      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: textColor),
      child: Text(user.name[0].toUpperCase()),
    );

    return Tooltip(
      message: user.name,
      child: UnconstrainedBox(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: userAvatarColor,
            shape: BoxShape.circle,
            border: hasBorder ? Border.all(color: Colors.grey[500]!.withValues(alpha: opacity), width: 1) : null,
          ),
          child: user.hasProfileImage
              ? ClipRRect(
                  borderRadius: BorderRadius.all(Radius.circular(size / 2)),
                  child: CachedNetworkImage(
                    fit: BoxFit.cover,
                    cacheKey: '${user.id}-${user.profileChangedAt.toIso8601String()}',
                    width: size,
                    height: size,
                    placeholder: (_, __) => Image.memory(kTransparentImage),
                    imageUrl: profileImageUrl,
                    httpHeaders: ApiService.getRequestHeaders(),
                    fadeInDuration: const Duration(milliseconds: 300),
                    errorWidget: (context, error, stackTrace) => textIcon,
                    color: Colors.white.withValues(alpha: opacity),
                    colorBlendMode: BlendMode.modulate,
                  ),
                )
              : Center(child: textIcon),
        ),
      ),
    );
  }
}
