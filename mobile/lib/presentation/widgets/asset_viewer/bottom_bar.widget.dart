import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/edit_asset.action.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/upload.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/add_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/ocr_toggle_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_controls.dart';
import 'package:immich_ui/immich_ui.dart';

// Resolved here rather than as an ActionColumnButton so a hidden restore
// takes no slot in the spaceEvenly row below.
List<Widget> _actionColumnButtons(BuildContext context, WidgetRef ref, List<ActionBuilder> actions) => actions
    .map((a) => a.create(context, ref))
    .nonNulls
    .map<ImmichColumnButton>(
      (item) => .new(icon: item.icon, label: item.label, onPressed: item.onAction, onLongPress: item.onSecondaryAction),
    )
    .toList(growable: false);

class ViewerBottomBar extends ConsumerWidget {
  const ViewerBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(assetViewerProvider.select((s) => s.currentAsset));
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    final showingDetails = ref.watch(assetViewerProvider.select((s) => s.showingDetails));
    final isInLockedView = ref.watch(inLockedViewProvider);
    final isInTrash = ref.watch(timelineServiceProvider).origin == TimelineOrigin.trash;

    final originalTheme = context.themeData;

    final actions = <Widget>[
      ..._actionColumnButtons(context, ref, const [RestoreAction(source: .viewer), ShareAction(source: .viewer)]),

      if (!isInLockedView) ...[
        if (!isInTrash) ...[
          ..._actionColumnButtons(context, ref, const [
            UploadAction(source: .viewer, showProgress: true),
            EditAssetAction(source: .viewer),
          ]),
          if (asset.hasRemote) ImmichColorOverride(color: null, child: AddActionButton(originalTheme: originalTheme)),
        ],
        ..._actionColumnButtons(context, ref, const [DeleteAction(source: .viewer)]),
      ],
    ];

    return AnimatedSwitcher(
      duration: Durations.short4,
      child: showingDetails
          ? const SizedBox.shrink()
          : Theme(
              data: context.themeData.copyWith(
                iconTheme: const IconThemeData(size: ImmichIconSize.md, color: Colors.white),
                textTheme: context.themeData.textTheme.copyWith(
                  labelLarge: context.themeData.textTheme.labelLarge?.copyWith(color: Colors.white),
                ),
              ),
              child: Stack(
                children: [
                  const Positioned.fill(
                    child: IgnorePointer(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [Colors.black45, Colors.black12, Colors.transparent],
                            stops: [0.0, 0.7, 1.0],
                          ),
                        ),
                      ),
                    ),
                  ),
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (asset.isImage) OcrToggleButton(asset: asset),
                          if (asset.isVideo) VideoControls(videoPlayerName: asset.id),
                          if (!isReadonlyModeEnabled)
                            ImmichColorOverride(
                              color: Colors.white,
                              child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: actions),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
