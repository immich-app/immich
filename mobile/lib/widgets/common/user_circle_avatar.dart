import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

class UserCircleAvatar extends StatelessWidget {
  final UserDto user;
  final double size;
  final bool hasBorder;
  final double opacity;

  const UserCircleAvatar({super.key, this.size = 44, this.hasBorder = false, this.opacity = 1, required this.user});

  // TODO(shenlong): Remove this factory when the UserDto is removed from the domain layer
  factory UserCircleAvatar.fromUser({
    required User user,
    double size = 44,
    bool hasBorder = false,
    double opacity = 1,
  }) => .new(
    user: .new(
      id: user.id,
      email: user.email,
      name: user.name,
      profileChangedAt: user.profileChangedAt,
      hasProfileImage: user.hasProfileImage,
      avatarColor: user.avatarColor,
    ),
    size: size,
    hasBorder: hasBorder,
    opacity: opacity,
  );

  @override
  Widget build(BuildContext context) {
    final userAvatarColor = user.avatarColor.toColor().withValues(alpha: opacity);
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/${user.id}/profile-image?d=${user.profileChangedAt.millisecondsSinceEpoch}';

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
            border: hasBorder ? Border.all(color: userAvatarColor.withValues(alpha: opacity), width: 1.5) : null,
          ),
          child: user.hasProfileImage
              ? ClipRRect(
                  borderRadius: BorderRadius.all(Radius.circular(size / 2)),
                  child: Image(
                    fit: BoxFit.cover,
                    width: size,
                    height: size,
                    image: RemoteImageProvider(url: profileImageUrl),
                    errorBuilder: (context, error, stackTrace) => textIcon,
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
