import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_date_time_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_location_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/favorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_album_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/stack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class RemoteAlbumBottomSheet extends ConsumerWidget {
  final RemoteAlbum album;
  const RemoteAlbumBottomSheet({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselect = ref.watch(multiSelectProvider);
    final isTrashEnable = ref.watch(
      serverInfoProvider.select((state) => state.serverFeatures.trash),
    );

    return BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.4,
      shouldCloseOnMinExtent: false,
      actions: [
        const ShareActionButton(),
        if (multiselect.hasRemote) ...[
          const ShareLinkActionButton(source: ActionSource.timeline),
          const ArchiveActionButton(source: ActionSource.timeline),
          const FavoriteActionButton(source: ActionSource.timeline),
          const DownloadActionButton(),
          isTrashEnable
              ? const TrashActionButton(source: ActionSource.timeline)
              : const DeletePermanentActionButton(
                  source: ActionSource.timeline,
                ),
          const EditDateTimeActionButton(),
          const EditLocationActionButton(source: ActionSource.timeline),
          const MoveToLockFolderActionButton(
            source: ActionSource.timeline,
          ),
          const StackActionButton(),
        ],
        if (multiselect.hasLocal) ...[
          const DeleteLocalActionButton(),
          const UploadActionButton(),
        ],
        RemoveFromAlbumActionButton(
          source: ActionSource.timeline,
          albumId: album.id,
        ),
      ],
    );
  }
}
