import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

class LockedFolderBottomSheet extends ConsumerWidget {
  const LockedFolderBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.4,
      shouldCloseOnMinExtent: false,
      actions: [
        ShareActionButton(),
        DownloadActionButton(),
        DeletePermanentActionButton(source: ActionSource.timeline),
        RemoveFromLockFolderActionButton(source: ActionSource.timeline),
      ],
    );
  }
}
