import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
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
        ActionColumnButton(action: ShareAction(source: .timeline)),
        DownloadActionButton(source: ActionSource.timeline),
        ActionColumnButton(action: DeleteAction(source: .timeline)),
        ActionColumnButton(action: LockAction(source: .timeline)),
      ],
    );
  }
}
