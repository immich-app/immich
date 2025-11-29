import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/quick_action_configurator.widget.dart';
import 'package:immich_mobile/providers/infrastructure/viewer_quick_action_order.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';
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
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final isTrashEnabled = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
    final currentAlbum = ref.watch(currentRemoteAlbumProvider);
    final advancedTroubleshooting = ref.watch(settingsProvider.notifier).get(Setting.advancedTroubleshooting);
    final quickActionOrder = ref.watch(viewerQuickActionOrderProvider);

    if (!showControls) {
      opacity = 0;
    }

    final buttonContext = ActionButtonContext(
      asset: asset,
      isOwner: isOwner,
      isArchived: isArchived,
      isTrashEnabled: isTrashEnabled,
      isStacked: asset is RemoteAsset && asset.stackId != null,
      isInLockedView: isInLockedView,
      currentAlbum: currentAlbum,
      advancedTroubleshooting: advancedTroubleshooting,
      source: ActionSource.viewer,
    );

    final quickActionTypes = ActionButtonBuilder.buildQuickActionTypes(
      buttonContext,
      quickActionOrder: quickActionOrder,
    );

    Future<void> openConfigurator() async {
      final viewerNotifier = ref.read(assetViewerProvider.notifier);

      viewerNotifier.setBottomSheet(true);

      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        enableDrag: false,
        builder: (sheetContext) => const FractionallySizedBox(heightFactor: 0.75, child: QuickActionConfigurator()),
      ).whenComplete(() {
        viewerNotifier.setBottomSheet(false);
      });
    }

    final actions = quickActionTypes
        .map((type) => GestureDetector(onLongPress: openConfigurator, child: type.buildButton(buttonContext)))
        .toList(growable: false);

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
                        if (!isInLockedView && !isReadonlyModeEnabled)
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
