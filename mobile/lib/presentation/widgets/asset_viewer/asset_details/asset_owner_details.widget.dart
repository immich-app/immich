import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:immich_ui/immich_ui.dart';

class AssetOwnerDetails extends ConsumerWidget {
  final BaseAsset asset;

  const AssetOwnerDetails({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }
    final remote = asset as RemoteAsset;

    // Hide if asset belongs to the current user
    final currentUserId = ref.watch(currentUserProvider)?.id;
    if (remote.ownerId == currentUserId) {
      return const SizedBox.shrink();
    }

    return _OwnerDetailsTile(ownerId: remote.ownerId);
  }
}

class _OwnerDetailsTile extends ConsumerWidget {
  final String ownerId;

  const _OwnerDetailsTile({required this.ownerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userServiceProvider).watch(ownerId);

    return StreamBuilder<User?>(
      stream: user,
      builder: (context, snapshot) {
        final ownerDto = snapshot.data;

        if (ownerDto == null) {
          return const SizedBox.shrink();
        }

        return Padding(
          padding: const .only(
            left: ImmichSpacing.lg,
            right: ImmichSpacing.lg,
            top: ImmichSpacing.md,
            bottom: ImmichSpacing.sm,
          ),
          child: Row(
            spacing: ImmichSpacing.md,
            children: [
              UserCircleAvatar.fromUser(user: ownerDto, size: 24, hasBorder: false, opacity: 0.8),
              Text(
                context.t.shared_by_user(user: ownerDto.name),
                style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ),
            ],
          ),
        );
      },
    );
  }
}
