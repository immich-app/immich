import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class TrashBottomBar extends ConsumerWidget {
  const TrashBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets = ref.watch(multiSelectProvider.select((s) => s.selectedAssets)).toList(growable: false);
    final scope = ActionScope.from(context, ref);

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        color: context.themeData.canvasColor,
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              DeleteAction(assets: assets, scope: scope),
              RestoreAction(assets: assets, scope: scope),
            ].map((action) => ActionColumnButtonWidget(action: TimelineAction(action: action))).toList(growable: false),
          ),
        ),
      ),
    );
  }
}
