import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class SetAlbumCoverActionButton extends ConsumerWidget {
  final String albumId;
  final ActionSource source;

  const SetAlbumCoverActionButton({super.key, required this.albumId, required this.source});

  Future<void> _onTap(BuildContext context, WidgetRef ref) async {
    final selectedAssets = ref.read(multiSelectProvider).selectedAssets;
    if (selectedAssets.length != 1) {
      ImmichToast.show(
        context: context,
        msg: 'select_single_asset_cover'.t(context: context),
        toastType: ToastType.info,
      );
      return;
    }

    final asset = selectedAssets.first;
    if (asset is! RemoteAsset) {
      return;
    }

    try {
      await ref.read(remoteAlbumProvider.notifier).updateAlbum(albumId, thumbnailAssetId: asset.id);

      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: 'album_cover_set'.t(context: context),
          toastType: ToastType.success,
        );
        ref.read(multiSelectProvider.notifier).reset();
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
    final selectedCount = ref.watch(multiSelectProvider.select((s) => s.selectedAssets.length));

    if (selectedCount != 1) {
      return const SizedBox();
    }

    return BaseActionButton(
      iconData: Icons.photo_album_outlined,
      label: "set_album_cover".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}
