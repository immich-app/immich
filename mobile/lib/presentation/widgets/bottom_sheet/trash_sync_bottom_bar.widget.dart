import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/trash_review.action.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class TrashSyncBottomBar extends ConsumerWidget {
  const TrashSyncBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final origin = ref.watch(timelineServiceProvider).origin;
    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: SizedBox(
          height: 64,
          child: ColoredBox(
            color: context.themeData.canvasColor,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: ActionButton(
                    action: KeepOnDeviceAction(source: ActionSource.timeline, origin: origin),
                  ),
                ),
                Expanded(
                  child: ActionButton(
                    action: MoveToTrashAction(source: ActionSource.timeline, origin: origin),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
