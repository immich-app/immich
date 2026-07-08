import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_actions.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class LockedFolderBottomSheet extends ConsumerWidget {
  const LockedFolderBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scope = ActionScope.from(context, ref);
    final assets = ref.watch(multiSelectProvider).selectedAssets.toList(growable: false);
    final actions = AssetActions.from(scope, assets);

    return BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.4,
      shouldCloseOnMinExtent: false,
      actions: [
        const ShareActionButton(source: ActionSource.timeline),
        const DownloadActionButton(source: ActionSource.timeline),
        ...[
          actions.delete,
          LockAction(assets: assets, scope: scope),
        ].map((action) => ActionColumnButtonWidget(action: TimelineAction(action: action))),
      ],
    );
  }
}
