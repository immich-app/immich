import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/cast_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/favorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/motion_photo_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unfavorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class ViewerTopAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const ViewerTopAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final user = ref.watch(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);

    final previousRouteName = ref.watch(previousRouteNameProvider);
    final showViewInTimelineButton = previousRouteName != TabShellRoute.name && previousRouteName != null;

    final isShowingSheet = ref.watch(assetViewerProvider.select((state) => state.showingBottomSheet));
    int opacity = ref.watch(assetViewerProvider.select((state) => state.backgroundOpacity));
    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));

    if (!showControls) {
      opacity = 0;
    }

    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));
    final websocketConnected = ref.watch(websocketProvider.select((c) => c.isConnected));

    final actions = <Widget>[
      if (isCasting || (asset.hasRemote && websocketConnected)) const CastActionButton(menuItem: true),
      if (showViewInTimelineButton)
        IconButton(
          onPressed: () async {
            await context.maybePop();
            await context.navigateTo(const TabShellRoute(children: [MainTimelineRoute()]));
            EventStream.shared.emit(ScrollToDateEvent(asset.createdAt));
          },
          icon: const Icon(Icons.image_search),
          tooltip: 'view_in_timeline',
        ),
      if (asset.hasRemote && isOwner && !asset.isFavorite)
        const FavoriteActionButton(source: ActionSource.viewer, menuItem: true),
      if (asset.hasRemote && isOwner && asset.isFavorite)
        const UnFavoriteActionButton(source: ActionSource.viewer, menuItem: true),
      if (asset.isMotionPhoto) const MotionPhotoActionButton(menuItem: true),
      const _KebabMenu(),
    ];

    final lockedViewActions = <Widget>[
      if (isCasting || (asset.hasRemote && websocketConnected)) const CastActionButton(menuItem: true),
      const _KebabMenu(),
    ];

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
          actions: isShowingSheet
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

class _KebabMenu extends ConsumerWidget {
  const _KebabMenu();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      onPressed: () {
        EventStream.shared.emit(const ViewerOpenBottomSheetEvent());
      },
      icon: const Icon(Icons.more_vert_rounded),
    );
  }
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
