import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/ui/transparent_image.dart';

// ignore: must_be_immutable
class UserCircleAvatar extends ConsumerWidget {
  final User user;
  double radius;
  double size;
  bool useRandomBackgroundColor;

  UserCircleAvatar({
    super.key,
    this.radius = 22,
    this.size = 44,
    this.useRandomBackgroundColor = false,
    required this.user,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final randomColors = [
      Colors.red[200],
      Colors.blue[200],
      Colors.green[200],
      Colors.yellow[200],
      Colors.purple[200],
      Colors.orange[200],
      Colors.pink[200],
      Colors.teal[200],
      Colors.indigo[200],
      Colors.cyan[200],
      Colors.brown[200],
    ];

    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/user/profile-image/${user.id}?d=${Random().nextInt(1024)}';

    final textIcon = Text(
      user.name[0].toUpperCase(),
      style: TextStyle(
        fontWeight: FontWeight.bold,
        color: context.isDarkTheme ? Colors.black : Colors.white,
      ),
    );
    return CircleAvatar(
      backgroundColor: useRandomBackgroundColor
          ? randomColors[Random().nextInt(randomColors.length)]
          : context.primaryColor,
      radius: radius,
      child: user.profileImagePath == ""
          ? textIcon
          : ClipRRect(
              borderRadius: BorderRadius.circular(50),
              child: CachedNetworkImage(
                fit: BoxFit.cover,
                cacheKey: user.profileImagePath,
                width: size,
                height: size,
                placeholder: (_, __) => Image.memory(kTransparentImage),
                imageUrl: profileImageUrl,
                httpHeaders: {
                  "Authorization": "Bearer ${Store.get(StoreKey.accessToken)}",
                },
                fadeInDuration: const Duration(milliseconds: 300),
                errorWidget: (context, error, stackTrace) => textIcon,
              ),
            ),
    );
  }
}
