import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/cast.action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/open_in_browser.action.dart';
import 'package:immich_mobile/presentation/actions/remove_from_album.action.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
import 'package:immich_mobile/presentation/actions/set_album_cover.action.dart';
import 'package:immich_mobile/presentation/actions/set_profile_picture.action.dart';
import 'package:immich_mobile/presentation/actions/similar_photos.action.dart';
import 'package:immich_mobile/presentation/actions/slideshow.action.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/routing/router.dart';

class ActionButtonContext {
  final BaseAsset asset;
  final bool isOwner;
  final bool isArchived;
  final bool isTrashEnabled;
  final bool isInLockedView;
  final bool isStacked;
  final RemoteAlbum? currentAlbum;
  final bool advancedTroubleshooting;
  final ActionSource source;
  final bool isCasting;
  final TimelineOrigin timelineOrigin;
  final int selectedCount;

  const ActionButtonContext({
    required this.asset,
    required this.isOwner,
    required this.isArchived,
    required this.isTrashEnabled,
    required this.isStacked,
    required this.isInLockedView,
    required this.currentAlbum,
    required this.advancedTroubleshooting,
    required this.source,
    this.isCasting = false,
    this.timelineOrigin = TimelineOrigin.main,
    this.selectedCount = 1,
  });
}

enum ActionButtonType {
  openInfo,
  likeActivity,
  share,
  shareLink,
  cast,
  setAlbumCover,
  similarPhotos,
  setProfilePicture,
  viewInTimeline,
  slideshow,
  download,
  upload,
  openInBrowser,
  unstack,
  archive,
  unarchive,
  moveToLockFolder,
  removeFromLockFolder,
  removeFromAlbum,
  restoreTrash,
  deleteLocal,
  delete,
  advancedInfo;

  bool shouldShow(ActionButtonContext context) {
    return switch (this) {
      ActionButtonType.advancedInfo => context.advancedTroubleshooting,
      ActionButtonType.share => true,
      ActionButtonType.shareLink =>
        !context.isInLockedView && //
            context.asset.hasRemote,
      ActionButtonType.archive =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote && //
            !context.isArchived,
      ActionButtonType.unarchive =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote && //
            context.isArchived,
      ActionButtonType.download =>
        !context.isInLockedView && //
            context.asset.hasRemote && //
            !context.asset.hasLocal,
      ActionButtonType.restoreTrash =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote && //
            context.timelineOrigin == TimelineOrigin.trash,
      ActionButtonType.delete => true, //
      ActionButtonType.moveToLockFolder =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote,
      ActionButtonType.removeFromLockFolder =>
        context.isOwner && //
            context.isInLockedView && //
            context.asset.hasRemote,
      ActionButtonType.deleteLocal =>
        !context.isInLockedView && //
            context.asset.isMerged,
      ActionButtonType.upload =>
        !context.isInLockedView && //
            context.asset.storage == AssetState.local,
      ActionButtonType.removeFromAlbum =>
        context.isOwner && //
            !context.isInLockedView && //
            context.currentAlbum != null,
      ActionButtonType.setAlbumCover =>
        !context.isInLockedView && //
            context.currentAlbum != null && //
            context.selectedCount == 1,
      ActionButtonType.unstack =>
        context.isOwner && //
            context.timelineOrigin != TimelineOrigin.trash &&
            !context.isInLockedView && //
            context.isStacked,
      ActionButtonType.openInBrowser => context.asset.hasRemote && !context.isInLockedView,
      ActionButtonType.likeActivity =>
        !context.isInLockedView &&
            context.currentAlbum != null &&
            context.currentAlbum!.isActivityEnabled &&
            context.currentAlbum!.isShared,
      ActionButtonType.similarPhotos =>
        !context.isInLockedView && //
            context.asset is RemoteAsset,
      ActionButtonType.setProfilePicture =>
        !context.isInLockedView && //
            context.asset is RemoteAsset && //
            context.isOwner,
      ActionButtonType.openInfo => true,
      ActionButtonType.viewInTimeline =>
        context.timelineOrigin != TimelineOrigin.main &&
            context.timelineOrigin != TimelineOrigin.deepLink &&
            context.timelineOrigin != TimelineOrigin.trash &&
            context.timelineOrigin != TimelineOrigin.lockedFolder &&
            context.timelineOrigin != TimelineOrigin.archive &&
            context.timelineOrigin != TimelineOrigin.localAlbum &&
            context.isOwner,
      ActionButtonType.cast => context.isCasting || context.asset.hasRemote,
      ActionButtonType.slideshow => true,
    };
  }

  Widget buildButton(
    ActionButtonContext context,
    BuildContext buildContext,

    WidgetRef ref, [
    bool iconOnly = false,
    bool menuItem = false,
  ]) {
    final scope = ActionScope.from(buildContext, ref);
    return switch (this) {
      ActionButtonType.advancedInfo => ActionMenuItemWidget(
        action: AssetDebugAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.share => ActionMenuItemWidget(
        action: ShareAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.shareLink => ActionMenuItemWidget(
        action: ShareLinkAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.slideshow => ActionMenuItemWidget(action: SlideshowAction(scope: scope)),
      ActionButtonType.archive || ActionButtonType.unarchive => ActionMenuItemWidget(
        action: ArchiveAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.download => DownloadActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.restoreTrash => ActionMenuItemWidget(
        action: RestoreAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.delete => ActionMenuItemWidget(
        action: DeleteAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.moveToLockFolder => ActionMenuItemWidget(
        action: LockAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.removeFromLockFolder => ActionMenuItemWidget(
        action: LockAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.deleteLocal => ActionMenuItemWidget(
        action: CleanupLocalAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.upload => UploadActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.removeFromAlbum => ActionMenuItemWidget(
        action: RemoveFromAlbumAction(assets: [context.asset], albumId: context.currentAlbum!.id, scope: scope),
      ),
      ActionButtonType.setAlbumCover => ActionMenuItemWidget(
        action: SetAlbumCoverAction(assets: [context.asset], albumId: context.currentAlbum!.id, scope: scope),
      ),
      ActionButtonType.likeActivity => LikeActivityActionButton(iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.unstack => ActionMenuItemWidget(
        action: StackAction(assets: [context.asset], scope: scope),
      ),
      ActionButtonType.openInBrowser => ActionMenuItemWidget(
        action: OpenInBrowserAction(remoteId: context.asset.remoteId!, origin: context.timelineOrigin, scope: scope),
      ),
      ActionButtonType.similarPhotos => ActionMenuItemWidget(
        action: SimilarPhotosAction(assetId: (context.asset as RemoteAsset).id, scope: scope),
      ),
      ActionButtonType.setProfilePicture => ActionMenuItemWidget(
        action: SetProfilePictureAction(asset: context.asset, scope: scope),
      ),
      ActionButtonType.openInfo => BaseActionButton(
        label: 'info'.tr(),
        iconData: Icons.info_outline,
        menuItem: true,
        onPressed: () => EventStream.shared.emit(const ViewerShowDetailsEvent()),
      ),
      ActionButtonType.viewInTimeline => BaseActionButton(
        label: 'view_in_timeline'.tr(),
        iconData: Icons.image_search,
        iconOnly: iconOnly,
        menuItem: menuItem,
        onPressed: () async {
          await buildContext.router.navigate(const TabShellRoute(children: [MainTimelineRoute()]));
          EventStream.shared.emit(ScrollToDateEvent(context.asset.createdAt));
        },
      ),
      ActionButtonType.cast => ActionMenuItemWidget(action: CastAction(scope: scope)),
    };
  }

  /// Defines which group each button belongs to for kebab menu.
  /// Buttons in the same group will be displayed together,
  /// with dividers separating different groups.
  int get kebabMenuGroup => switch (this) {
    // 0: info
    ActionButtonType.openInfo => 0,
    // 10: move, remove, and delete
    ActionButtonType.removeFromLockFolder => 10,
    ActionButtonType.removeFromAlbum => 10,
    ActionButtonType.unstack => 10,
    ActionButtonType.archive => 10,
    ActionButtonType.unarchive => 10,
    ActionButtonType.moveToLockFolder => 10,
    ActionButtonType.deleteLocal => 10,
    ActionButtonType.delete => 10,
    ActionButtonType.restoreTrash => 10,
    // 90: advancedInfo
    ActionButtonType.advancedInfo => 90,
    // 1: others
    _ => 1,
  };
}

class ActionButtonBuilder {
  static const List<ActionButtonType> _actionTypes = ActionButtonType.values;
  static const List<ActionButtonType> defaultViewerKebabMenuOrder = _actionTypes;
  static const Set<ActionButtonType> defaultViewerBottomBarButtons = {
    ActionButtonType.share,
    ActionButtonType.moveToLockFolder,
    ActionButtonType.upload,
    ActionButtonType.delete,
    ActionButtonType.archive,
    ActionButtonType.unarchive,
    ActionButtonType.restoreTrash,
  };

  static List<Widget> build(ActionButtonContext context, BuildContext buildContext, WidgetRef ref) {
    return _actionTypes
        .where((type) => type.shouldShow(context))
        .map((type) => type.buildButton(context, buildContext, ref))
        .toList();
  }

  static List<Widget> buildViewerKebabMenu(ActionButtonContext context, BuildContext buildContext, WidgetRef ref) {
    final visibleButtons = defaultViewerKebabMenuOrder
        .where((type) => !defaultViewerBottomBarButtons.contains(type) && type.shouldShow(context))
        .toList();

    if (visibleButtons.isEmpty) {
      return [];
    }

    final List<Widget> result = [];
    int? lastGroup;

    for (final type in visibleButtons) {
      if (lastGroup != null && type.kebabMenuGroup != lastGroup) {
        result.add(const Divider(height: 1));
      }
      result.add(type.buildButton(context, buildContext, ref, false, true));
      lastGroup = type.kebabMenuGroup;
    }

    return result;
  }
}
