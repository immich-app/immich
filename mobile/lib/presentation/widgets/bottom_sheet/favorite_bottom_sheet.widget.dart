import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_date_time_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_location_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/stack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unfavorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unstack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class FavoriteBottomSheet extends ConsumerWidget {
  const FavoriteBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselect = ref.watch(multiSelectProvider);
    final isTrashEnable = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));

    Future<void> addAssetsToAlbum(RemoteAlbum album) async {
      final selectedAssets = multiselect.selectedAssets;
      if (selectedAssets.isEmpty) {
        return;
      }

      final remoteAssets = selectedAssets.whereType<RemoteAsset>();
      final addedCount = await ref
          .read(remoteAlbumProvider.notifier)
          .addAssets(album.id, remoteAssets.map((e) => e.id).toList());

      if (selectedAssets.length != remoteAssets.length) {
        ImmichToast.show(
          context: context,
          msg: 'add_to_album_bottom_sheet_some_local_assets'.t(context: context),
        );
      }

      if (addedCount != remoteAssets.length) {
        ImmichToast.show(
          context: context,
          msg: 'add_to_album_bottom_sheet_already_exists'.t(args: {"album": album.name}),
        );
      } else {
        ImmichToast.show(
          context: context,
          msg: 'add_to_album_bottom_sheet_added'.t(args: {"album": album.name}),
        );
      }

      ref.read(multiSelectProvider.notifier).reset();
    }

    return BaseBottomSheet(
      initialChildSize: 0.4,
      maxChildSize: 0.7,
      shouldCloseOnMinExtent: false,
      actions: [
        const ShareActionButton(source: ActionSource.timeline),
        if (multiselect.hasRemote) ...[
          const ShareLinkActionButton(source: ActionSource.timeline),
          const UnFavoriteActionButton(source: ActionSource.timeline),
          const ArchiveActionButton(source: ActionSource.timeline),
          const DownloadActionButton(source: ActionSource.timeline),
          isTrashEnable
              ? const TrashActionButton(source: ActionSource.timeline)
              : const DeletePermanentActionButton(source: ActionSource.timeline),
          const EditDateTimeActionButton(source: ActionSource.timeline),
          const EditLocationActionButton(source: ActionSource.timeline),
          const MoveToLockFolderActionButton(source: ActionSource.timeline),
          if (multiselect.selectedAssets.length > 1) const StackActionButton(source: ActionSource.timeline),
          if (multiselect.hasStacked) const UnStackActionButton(source: ActionSource.timeline),
        ],
        if (multiselect.hasMerged) const DeleteLocalActionButton(source: ActionSource.timeline),
      ],
      slivers: multiselect.hasRemote
          ? [const AddToAlbumHeader(), AlbumSelector(onAlbumSelected: addAssetsToAlbum)]
          : [],
    );
  }
}
