import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';

class TrashBottomBar extends StatelessWidget {
  const TrashBottomBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        color: context.themeData.canvasColor,
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: const SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: <ActionColumnButton>[
              .new(action: AssetDebugAction(source: .timeline)),
              .new(action: DeleteAction(source: .timeline)),
              .new(action: RestoreAction(source: .timeline)),
            ],
          ),
        ),
      ),
    );
  }
}
