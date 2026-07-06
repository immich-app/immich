import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class LockedFolderBottomSheet extends ConsumerWidget {
  const LockedFolderBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselect = ref.watch(multiSelectProvider);
    final scope = ActionScope.from(context, ref);
    return BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.4,
      shouldCloseOnMinExtent: false,
      actions: [
        const ShareActionButton(source: ActionSource.timeline),
        const DownloadActionButton(source: ActionSource.timeline),
        const DeletePermanentActionButton(source: ActionSource.timeline),
        ActionColumnButtonWidget(
          action: TimelineAction(
            action: LockAction(assets: multiselect.selectedAssets.toList(growable: false), scope: scope),
          ),
        ),
      ],
    );
  }
}
