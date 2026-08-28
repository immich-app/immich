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
    final serverEndpoint = ref.watch(authSessionProvider.select((s) => s.serverEndpoint));
    final nameFirstLetter = name.isNotEmpty ? name[0] : "";
    return CircleAvatar(
      radius: 16,
      backgroundColor: context.primaryColor.withAlpha(50),
      foregroundImage: RemoteImageProvider(url: "$serverEndpoint/users/$userId/profile-image"),
      // silence errors if user has no profile image, use initials as fallback
      onForegroundImageError: (exception, stackTrace) {},
      child: Text(nameFirstLetter.toUpperCase()),
    );
  }
}
