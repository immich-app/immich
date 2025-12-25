import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

class LikeActivityActionButton extends ConsumerWidget {
  const LikeActivityActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider);
    final asset = ref.watch(currentAssetNotifier) as RemoteAsset?;
    final user = ref.watch(currentUserProvider);

    final activities = ref.watch(albumActivityProvider(album?.id ?? "", asset?.id));

    onTap(Activity? liked) async {
      if (user == null) {
        return;
      }

      if (liked != null) {
        await ref.read(albumActivityProvider(album?.id ?? "", asset?.id).notifier).removeActivity(liked.id);
      } else {
        await ref.read(albumActivityProvider(album?.id ?? "", asset?.id).notifier).addLike();
      }

      ref.invalidate(albumActivityProvider(album?.id ?? "", asset?.id));
    }

    return activities.when(
      data: (data) {
        final liked = data.firstWhereOrNull(
          (a) => a.type == ActivityType.like && a.user.id == user?.id && a.assetId == asset?.id,
        );

        return BaseActionButton(
          maxWidth: 60,
          iconData: liked != null ? Icons.thumb_up : Icons.thumb_up_off_alt,
          label: "like".t(context: context),
          onPressed: () => onTap(liked),
          iconOnly: iconOnly,
          menuItem: menuItem,
        );
      },

      // default to empty heart during loading
      loading: () => BaseActionButton(
        iconData: Icons.thumb_up_off_alt,
        label: "like".t(context: context),
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      error: (error, stack) => Text('error_saving_image'.tr(args: [error.toString()])),
    );
  }
}
