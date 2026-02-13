import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

// ignore: must_be_immutable
class UserCircleAvatar extends ConsumerWidget {
  final UserDto user;
  double radius;
  double size;
  bool hasBorder;

  UserCircleAvatar({super.key, this.radius = 22, this.size = 44, this.hasBorder = false, required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAvatarColor = user.avatarColor.toColor();
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/${user.id}/profile-image?d=${user.profileChangedAt.millisecondsSinceEpoch}';

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
          border: hasBorder ? Border.all(color: Colors.grey[500]!, width: 1) : null,
        ),
        child: CircleAvatar(
          backgroundColor: userAvatarColor,
          radius: radius,
          child: user.hasProfileImage
              ? ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(50)),
                  child: Image(
                    fit: BoxFit.cover,
                    width: size,
                    height: size,
                    image: RemoteImageProvider(url: profileImageUrl),
                    errorBuilder: (context, error, stackTrace) => textIcon,
                  ),
                )
              : textIcon,
        ),
      ),
    );
  }
}
