import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';

class TrashBottomBar extends ConsumerWidget {
  const TrashBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        color: context.themeData.canvasColor,
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: const SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: <TimelineSheetActionWidget>[
              .new(action: TrashAction()),
              .new(action: DeletePermanentlyAction()),
              .new(action: DeleteLocalAction()),
              .new(action: RestoreAction()),
            ],
          ),
        ),
      ),
    );
  }
}
