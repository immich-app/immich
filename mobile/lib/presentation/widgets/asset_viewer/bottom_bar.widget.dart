import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
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

    final user = ref.watch(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isSheetOpen = ref.watch(
      assetViewerProvider.select((s) => s.showingBottomSheet),
    );
    int opacity = ref.watch(
      assetViewerProvider.select((state) => state.backgroundOpacity),
    );
    final showControls =
        ref.watch(assetViewerProvider.select((s) => s.showingControls));

    if (!showControls) {
      opacity = 0;
    }

    final actions = <Widget>[
      const ShareActionButton(),
      const _EditActionButton(),
      if (asset.hasRemote && isOwner)
        const ArchiveActionButton(source: ActionSource.viewer),
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
              : SafeArea(
                  child: Theme(
                    data: context.themeData.copyWith(
                      iconTheme:
                          const IconThemeData(size: 22, color: Colors.white),
                      textTheme: context.themeData.textTheme.copyWith(
                        labelLarge:
                            context.themeData.textTheme.labelLarge?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ),
                    child: Container(
                      height: asset.isVideo ? 160 : 80,
                      color: Colors.black.withAlpha(125),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (asset.isVideo) const VideoControls(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: actions,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

class _EditActionButton extends ConsumerWidget {
  const _EditActionButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.tune_outlined,
      label: 'edit'.t(context: context),
    );
  }
}
