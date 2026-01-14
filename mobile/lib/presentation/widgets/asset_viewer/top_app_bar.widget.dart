import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/favorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/motion_photo_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unfavorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_kebab_menu.widget.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

class ViewerTopAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const ViewerTopAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final album = ref.watch(currentRemoteAlbumProvider);

    final user = ref.watch(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);

    final isShowingSheet = ref.watch(assetViewerProvider.select((state) => state.showingBottomSheet));
    int opacity = ref.watch(assetViewerProvider.select((state) => state.backgroundOpacity));
    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));

    if (album != null && album.isActivityEnabled && album.isShared && asset is RemoteAsset) {
      ref.watch(albumActivityProvider(album.id, asset.id));
    }

    if (!showControls) {
      opacity = 0;
    }

    final originalTheme = context.themeData;

    final actions = <Widget>[
      if (asset.isMotionPhoto) const MotionPhotoActionButton(iconOnly: true),
      if (album != null && album.isActivityEnabled && album.isShared)
        IconButton(
          icon: const Icon(Icons.chat_outlined),
          onPressed: () {
            EventStream.shared.emit(const ViewerOpenBottomSheetEvent(activitiesMode: true));
          },
        ),

      if (asset.hasRemote && isOwner && !asset.isFavorite)
        const FavoriteActionButton(source: ActionSource.viewer, iconOnly: true),
      if (asset.hasRemote && isOwner && asset.isFavorite)
        const UnFavoriteActionButton(source: ActionSource.viewer, iconOnly: true),

      ViewerKebabMenu(originalTheme: originalTheme),
    ];

    final lockedViewActions = <Widget>[ViewerKebabMenu(originalTheme: originalTheme)];

    return IgnorePointer(
      ignoring: opacity < 255,
      child: AnimatedOpacity(
        opacity: opacity / 255,
        duration: Durations.short2,
        child: AppBar(
          backgroundColor: isShowingSheet ? Colors.transparent : Colors.black.withAlpha(125),
          leading: const _AppBarBackButton(),
          iconTheme: const IconThemeData(size: 22, color: Colors.white),
          actionsIconTheme: const IconThemeData(size: 22, color: Colors.white),
          shape: const Border(),
          actions: isShowingSheet || isReadonlyModeEnabled
              ? null
              : isInLockedView
              ? lockedViewActions
              : actions,
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(60.0);
}

class _AppBarBackButton extends ConsumerWidget {
  const _AppBarBackButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isShowingSheet = ref.watch(assetViewerProvider.select((state) => state.showingBottomSheet));
    final backgroundColor = isShowingSheet && !context.isDarkTheme ? Colors.white : Colors.black;
    final foregroundColor = isShowingSheet && !context.isDarkTheme ? Colors.black : Colors.white;

    return Padding(
      padding: const EdgeInsets.only(left: 12.0),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          shape: const CircleBorder(),
          iconSize: 22,
          iconColor: foregroundColor,
          padding: EdgeInsets.zero,
          elevation: isShowingSheet ? 4 : 0,
        ),
        onPressed: context.maybePop,
        child: const Icon(Icons.arrow_back_rounded),
      ),
    );
  }
}
