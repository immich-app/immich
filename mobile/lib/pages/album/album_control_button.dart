import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/album/album_action_filled_button.dart';

// ignore: must_be_immutable
class AlbumControlButton extends ConsumerWidget {
  void Function() onAddPhotosPressed;
  void Function() onAddUsersPressed;

  AlbumControlButton({
    super.key,
    required this.onAddPhotosPressed,
    required this.onAddUsersPressed,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(authProvider).userId;
    final isOwner = ref.watch(
      currentAlbumProvider.select((album) {
        return album?.ownerId == userId;
      }),
    );

    return Padding(
      padding: const EdgeInsets.only(left: 16.0, top: 8, bottom: 16),
      child: SizedBox(
        height: 40,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: [
            AlbumActionFilledButton(
              key: const ValueKey('add_photos_button'),
              iconData: Icons.add_photo_alternate_outlined,
              onPressed: onAddPhotosPressed,
              labelText: "add_photos".tr(),
            ),
            if (isOwner)
              AlbumActionFilledButton(
                key: const ValueKey('add_users_button'),
                iconData: Icons.person_add_alt_rounded,
                onPressed: onAddUsersPressed,
                labelText: "album_viewer_page_share_add_users".tr(),
              ),
          ],
        ),
      ),
    );
  }
}
