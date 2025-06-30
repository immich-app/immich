import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_date_time_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_location_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/favorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/stack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_buton.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_app_bar/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class HomeBottomAppBar extends ConsumerWidget {
  const HomeBottomAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselect = ref.watch(multiSelectProvider);
    final isTrashEnable = ref.watch(
      serverInfoProvider.select((state) => state.serverFeatures.trash),
    );

    return BaseBottomSheet(
      initialChildSize: 0.25,
      minChildSize: 0.22,
      actions: [
        const ShareActionButton(),
        if (multiselect.hasRemote) ...[
          const ShareLinkActionButton(),
          const ArchiveActionButton(),
          const FavoriteActionButton(),
          const DownloadActionButton(),
          isTrashEnable
              ? const TrashActionButton()
              : const DeletePermanentActionButton(),
          const EditDateTimeActionButton(),
          const EditLocationActionButton(),
          const MoveToLockFolderActionButton(),
          const StackActionButton(),
        ],
        if (multiselect.hasLocal) ...[
          const DeleteLocalActionButton(),
          const UploadActionButton(),
        ],
      ],
    );
  }
}
