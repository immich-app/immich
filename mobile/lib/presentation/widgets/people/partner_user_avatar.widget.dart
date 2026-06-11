import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/session.provider.dart';

class PartnerUserAvatar extends ConsumerWidget {
  const PartnerUserAvatar({super.key, required this.userId, required this.name});

  final String userId;
  final String name;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final url = "${ref.read(sessionProvider).serverEndpoint}/users/$userId/profile-image";
    final nameFirstLetter = name.isNotEmpty ? name[0] : "";
    return CircleAvatar(
      radius: 16,
      backgroundColor: context.primaryColor.withAlpha(50),
      foregroundImage: RemoteImageProvider(url: url),
      // silence errors if user has no profile image, use initials as fallback
      onForegroundImageError: (exception, stackTrace) {},
      child: Text(nameFirstLetter.toUpperCase()),
    );
  }
}
