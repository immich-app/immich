import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';

class AssetOwnerDetails extends ConsumerWidget {
  final BaseAsset asset;
  final ExifInfo? exifInfo;

  const AssetOwnerDetails({super.key, required this.asset, this.exifInfo});

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

    if (remote.ownerName.isNotEmpty) {
      return _buildOwnerTile(
        context: context,
        ownerId: remote.ownerId,
        ownerName: remote.ownerName,
        ownerHasProfileImage: remote.ownerHasProfileImage,
        ownerProfileChangedAt: remote.ownerProfileChangedAt,
        ownerAvatarColor: remote.ownerAvatarColor,
      );
    }

    return FutureBuilder<UserDto?>(
      future: ref.read(userRepositoryProvider).getById(remote.ownerId),
      builder: (context, snapshot) {
        final ownerDto = snapshot.data;
        return _buildOwnerTile(
          context: context,
          ownerId: remote.ownerId,
          ownerName: ownerDto?.name ?? 'Unknown',
          ownerHasProfileImage: ownerDto?.hasProfileImage ?? false,
          ownerProfileChangedAt: ownerDto?.profileChangedAt,
          ownerAvatarColor: ownerDto?.avatarColor ?? AvatarColor.primary,
        );
      },
    );
  }

  Widget _buildOwnerTile({
    required BuildContext context,
    required String ownerId,
    required String ownerName,
    required bool ownerHasProfileImage,
    required DateTime? ownerProfileChangedAt,
    required AvatarColor ownerAvatarColor,
  }) {
    final avatarColor = ownerAvatarColor.toColor();
    final profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/users/$ownerId/profile-image'
        '${ownerProfileChangedAt != null ? '?d=${ownerProfileChangedAt.millisecondsSinceEpoch}' : ''}';

    return Column(
      children: [
        SheetTile(
          title: 'shared_by'.t(context: context),
          titleStyle: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
        ),
        SheetTile(
          leading: CircleAvatar(
            radius: 20,
            backgroundColor: avatarColor,
            foregroundImage: ownerHasProfileImage ? RemoteImageProvider(url: profileImageUrl) : null,
            onForegroundImageError: ownerHasProfileImage ? (exception, stackTrace) {} : null,
            child: Text(
              ownerName.isNotEmpty ? ownerName[0].toUpperCase() : '?',
              style: TextStyle(fontSize: 16, color: avatarColor.computeLuminance() > 0.5 ? Colors.black : Colors.white),
            ),
          ),
          title: ownerName.isNotEmpty ? ownerName : 'Unknown',
          titleStyle: context.textTheme.labelLarge,
        ),
      ],
    );
  }
}
