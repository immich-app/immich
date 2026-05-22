import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

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
