import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/presentation/components/image/immich_cached_network_image.widget.dart';
import 'package:immich_mobile/presentation/components/image/transparent_image.dart';
import 'package:immich_mobile/utils/immich_image_url_helper.dart';

class ImUserAvatar extends StatelessWidget {
  final User user;
  final double? dimension;
  final double? radius;

  const ImUserAvatar({
    super.key,
    required this.user,
    this.dimension,
    this.radius,
  });

  @override
  Widget build(BuildContext context) {
    bool isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    final textIcon = Text(
      user.name[0].toUpperCase(),
      style: TextStyle(
        color: isDarkTheme && user.avatarColor == UserAvatarColor.primary
            ? Colors.black
            : Colors.white,
        fontSize: 12,
        fontWeight: FontWeight.bold,
      ),
    );

    return CircleAvatar(
      backgroundColor: user.avatarColor.toColor(),
      radius: radius,
      child: user.profileImagePath.isEmpty
          ? textIcon
          : ClipOval(
              child: ImCachedNetworkImage(
                imageUrl: ImImageUrlHelper.getUserAvatarUrl(user),
                cacheKey: user.profileImagePath,
                height: dimension,
                width: dimension,
                fit: BoxFit.cover,
                placeholder: (_, __) => Image.memory(
                  kTransparentImage,
                  semanticLabel: 'Transparent Image',
                ),
                fadeInDuration: const Duration(milliseconds: 300),
                errorWidget: (_, error, stackTrace) => SizedBox.square(),
              ),
            ),
    );
  }
}
