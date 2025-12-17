import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/add_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_image_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/keep_on_device_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_controls.dart';

class ViewerBottomBar extends ConsumerWidget {
  const ViewerBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    final user = ref.watch(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isSheetOpen = ref.watch(assetViewerProvider.select((s) => s.showingBottomSheet));
    int opacity = ref.watch(assetViewerProvider.select((state) => state.backgroundOpacity));
    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));
    final isInLockedView = ref.watch(inLockedViewProvider);

    final timelineOrigin = ref.read(timelineServiceProvider).origin;
    final isSyncTrashTimeline = timelineOrigin == TimelineOrigin.syncTrash;
    final isWaitingForSyncApproval = ref.watch(isWaitingForSyncApprovalProvider(asset.checksum!)).value == true;

    if (!showControls) {
      opacity = 0;
    }

    final originalTheme = context.themeData;

    final actions = <Widget>[
      if (isSyncTrashTimeline || isWaitingForSyncApproval) ...[
        const Text('asset_out_of_sync_actions_title').tr(),
        const KeepOnDeviceActionButton(source: ActionSource.viewer, isPreview: true),
        const MoveToTrashActionButton(source: ActionSource.viewer, isPreview: true),
      ] else ...[
        const ShareActionButton(source: ActionSource.viewer),

        if (!isInLockedView) ...[
          if (asset.isLocalOnly) const UploadActionButton(source: ActionSource.viewer),
          if (asset.type == AssetType.image) const EditImageActionButton(),
          if (asset.hasRemote) AddActionButton(originalTheme: originalTheme),

          if (isOwner) ...[
            asset.isLocalOnly
                ? const DeleteLocalActionButton(source: ActionSource.viewer)
                : const DeleteActionButton(source: ActionSource.viewer, showConfirmation: true),
          ],
        ],
        //todo check it!
        // if (isWaitingForSyncApproval) ...[
        //   DecoratedBox(
        //     decoration: BoxDecoration(
        //       border: Border.all(color: const Color.fromARGB(155, 243, 188, 106), width: 0.5),
        //       borderRadius: const BorderRadius.all(Radius.circular(24)),
        //     ),
        //     child: Column(
        //       children: [
        //         const Text('asset_out_of_sync_trash_confirmation_title').tr(),
        //         const Row(
        //           children: [
        //             KeepOnDeviceActionButton(source: ActionSource.viewer, isPreview: true),
        //             MoveToTrashActionButton(source: ActionSource.viewer, isPreview: true),
        //           ],
        //         ),
        //       ],
        //     ),
        //   ),
        // ],
      ],
    ];

    return IgnorePointer(
      ignoring: opacity < 255,
      child: AnimatedOpacity(
        opacity: opacity / 255,
        duration: Durations.short2,
        child: AnimatedSwitcher(
          duration: Durations.short4,
          child: isSheetOpen
              ? const SizedBox.shrink()
              : Theme(
                  data: context.themeData.copyWith(
                    iconTheme: const IconThemeData(size: 22, color: Colors.white),
                    textTheme: context.themeData.textTheme.copyWith(
                      labelLarge: context.themeData.textTheme.labelLarge?.copyWith(color: Colors.white),
                    ),
                  ),
                  child: Container(
                    color: Colors.black.withAlpha(125),
                    padding: EdgeInsets.only(bottom: context.padding.bottom, top: 16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (asset.isVideo) const VideoControls(),
                        if (!isReadonlyModeEnabled)
                          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: actions),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}
