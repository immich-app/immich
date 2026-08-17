import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

class LikeActivityActionButton extends ConsumerWidget {
  const LikeActivityActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider);
    final asset = ref.watch(assetViewerProvider.select((s) => s.currentAsset)) as RemoteAsset?;
    final user = ref.watch(currentUserProvider);

    final activities = ref.watch(albumActivityProvider((album?.id ?? "", asset?.id)));

    Future<void> onTap(Activity? liked) async {
      if (user == null) {
        return;
      }

      if (liked != null) {
        await ref.read(albumActivityProvider((album?.id ?? "", asset?.id)).notifier).removeActivity(liked.id);
      } else {
        await ref.read(albumActivityProvider((album?.id ?? "", asset?.id)).notifier).addLike();
      }

      ref.invalidate(albumActivityProvider((album?.id ?? "", asset?.id)));
    }

    return activities.when(
      data: (data) {
        final liked = data.firstWhereOrNull(
          (a) => a.type == ActivityType.like && a.user.id == user?.id && a.assetId == asset?.id,
        );

        return BaseActionButton(
          maxWidth: 60,
          iconData: liked != null ? Icons.thumb_up : Icons.thumb_up_off_alt,
          label: context.t.like,
          onPressed: () => onTap(liked),
          iconOnly: iconOnly,
          menuItem: menuItem,
        );
      },

      // default to empty heart during loading
      loading: () => BaseActionButton(
        iconData: Icons.thumb_up_off_alt,
        label: context.t.like,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      error: (error, stack) => Text(context.t.error_saving_image(error: error.toString())),
    );
  }
}
