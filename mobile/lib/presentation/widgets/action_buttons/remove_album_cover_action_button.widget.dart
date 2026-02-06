import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/constants/enums.dart';

class RemoveAlbumCoverActionButton extends ConsumerWidget {
  final String albumId;
  final ActionSource source;

  const RemoveAlbumCoverActionButton({super.key, required this.albumId, required this.source});

  Future<void> _onTap(BuildContext context, WidgetRef ref) async {
    try {
      // Setting thumbnailAssetId to an empty string effectively removes the custom cover
      await ref.read(remoteAlbumProvider.notifier).updateAlbum(albumId, thumbnailAssetId: "");

      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: 'album_cover_removed'.t(context: context),
          toastType: ToastType.success,
        );
      }
    } catch (e) {
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: 'error'.t(context: context),
          toastType: ToastType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.no_photography_outlined,
      label: "remove_album_cover".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}
