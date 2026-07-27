import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/edit_image.action.dart';
import 'package:immich_mobile/presentation/actions/open_activity.action.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/cast_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/add_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/open_in_browser_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_album_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/restore_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/set_album_cover.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/set_profile_picture_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/similar_photos_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/slideshow_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unarchive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unstack_action_button.widget.dart';
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
  final ThemeData? originalTheme;
  final SemVer serverVersion;

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
    this.originalTheme,
    this.serverVersion = const SemVer(major: 0, minor: 0, patch: 0),
  });
}

enum ActionButtonType {
  openInfo,
  openActivity,
  likeActivity,
  share,
  editImage,
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
  trash,
  deleteLocal,
  deletePermanent,
  delete,
  addTo,
  advancedInfo;

  bool _isInActivityAlbum(ActionButtonContext context) {
    return !context.isInLockedView &&
        context.currentAlbum != null &&
        context.currentAlbum!.isActivityEnabled &&
        context.currentAlbum!.isShared;
  }

  bool shouldShow(ActionButtonContext context) {
    return switch (this) {
      ActionButtonType.advancedInfo => AssetDebugAction.canShow(
        assetCount: context.selectedCount,
        advancedTroubleshooting: context.advancedTroubleshooting,
      ),
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
      ActionButtonType.trash =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote && //
            context.isTrashEnabled && //
            context.timelineOrigin != TimelineOrigin.trash,
      ActionButtonType.restoreTrash =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote && //
            context.timelineOrigin == TimelineOrigin.trash,
      ActionButtonType.deletePermanent =>
        context.isOwner && //
            context.asset.hasRemote && //
            (!context.isTrashEnabled || context.timelineOrigin == TimelineOrigin.trash || context.isInLockedView),
      ActionButtonType.delete =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote,
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
            context.asset.hasLocal,
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
      ActionButtonType.likeActivity => _isInActivityAlbum(context),
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
      ActionButtonType.editImage => EditImageAction.canShow(
        asset: context.asset,
        isInLockedView: context.isInLockedView,
        serverVersion: context.serverVersion,
      ),
      ActionButtonType.addTo =>
        !context.isInLockedView && //
            context.asset.hasRemote,
      ActionButtonType.openActivity => OpenActivityAction.canShow(
        isInLockedView: context.isInLockedView,
        album: context.currentAlbum,
      ),
      ActionButtonType.slideshow => true,
    };
  }

  bool showsAt(ButtonPosition position, ActionButtonContext context) => switch (this) {
    ActionButtonType.openActivity || ActionButtonType.likeActivity =>
      position != ButtonPosition.bottomBar || context.timelineOrigin != TimelineOrigin.trash,
    ActionButtonType.editImage => position != ButtonPosition.bottomBar || context.currentAlbum?.isShared != true,
    _ => true,
  };

  Widget buildButton(
    ActionButtonContext context, [
    BuildContext? buildContext,
    bool iconOnly = false,
    bool menuItem = false,
  ]) {
    return switch (this) {
      ActionButtonType.advancedInfo => ActionMenuItemWidget(action: AssetDebugAction(assets: [context.asset])),
      ActionButtonType.share => ShareActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.shareLink => ShareLinkActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.slideshow => SlideshowActionButton(iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.archive => ArchiveActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.unarchive => UnArchiveActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.download => DownloadActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.trash => TrashActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.restoreTrash => RestoreActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.deletePermanent => DeletePermanentActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
        useShortLabel: false,
      ),
      ActionButtonType.delete => DeleteActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
        showConfirmation: true,
      ),
      ActionButtonType.moveToLockFolder => MoveToLockFolderActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.removeFromLockFolder => RemoveFromLockFolderActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.deleteLocal => DeleteLocalActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.upload => UploadActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.removeFromAlbum => RemoveFromAlbumActionButton(
        albumId: context.currentAlbum!.id,
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.setAlbumCover => SetAlbumCoverActionButton(
        albumId: context.currentAlbum!.id,
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.likeActivity => LikeActivityActionButton(iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.unstack => UnStackActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.openInBrowser => OpenInBrowserActionButton(
        remoteId: context.asset.remoteId!,
        origin: context.timelineOrigin,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.similarPhotos => SimilarPhotosActionButton(
        assetId: (context.asset as RemoteAsset).id,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.setProfilePicture => SetProfilePictureActionButton(
        asset: context.asset,
        iconOnly: iconOnly,
        menuItem: menuItem,
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
        onPressed: buildContext == null
            ? null
            : () async {
                await buildContext.router.navigate(const TabShellRoute(children: [MainTimelineRoute()]));
                EventStream.shared.emit(ScrollToDateEvent(context.asset.createdAt));
              },
      ),
      ActionButtonType.cast => CastActionButton(iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.editImage when menuItem => ActionMenuItemWidget(
        action: EditImageAction(assets: [context.asset]),
      ),
      ActionButtonType.editImage => ActionColumnButtonWidget(action: EditImageAction(assets: [context.asset])),
      ActionButtonType.addTo => AddActionButton(originalTheme: context.originalTheme),
      ActionButtonType.openActivity when menuItem => ActionMenuItemWidget(
        action: OpenActivityAction(assets: [context.asset]),
      ),
      ActionButtonType.openActivity => ActionColumnButtonWidget(action: OpenActivityAction(assets: [context.asset])),
    };
  }

  /// Defines which group each button belongs to for kebab menu.
  /// Buttons in the same group will be displayed together,
  /// with dividers separating different groups.
  int get kebabMenuGroup => switch (this) {
    // 0: info
    ActionButtonType.openInfo => 0,
    // 10: move, remove, and delete
    ActionButtonType.trash => 10,
    ActionButtonType.deletePermanent => 10,
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
  static const List<ActionButtonType> _defaultViewerBottomBarOrder = [
    ActionButtonType.share,
    ActionButtonType.upload,
    ActionButtonType.editImage,
    ActionButtonType.addTo,
    ActionButtonType.openActivity,
    ActionButtonType.likeActivity,
    ActionButtonType.removeFromLockFolder,
    ActionButtonType.restoreTrash,
    ActionButtonType.deletePermanent,
    ActionButtonType.delete,
    ActionButtonType.deleteLocal,
  ];

  static List<Widget> build(ActionButtonContext context) {
    return _actionTypes.where((type) => type.shouldShow(context)).map((type) => type.buildButton(context)).toList();
  }

  static List<ActionButtonType> getViewerBottomBarTypes(ActionButtonContext context) {
    return _defaultViewerBottomBarOrder
        .where((type) => type.shouldShow(context) && type.showsAt(ButtonPosition.bottomBar, context))
        .take(4)
        .toList();
  }

  static List<ActionButtonType> getViewerKebabMenuTypes(ActionButtonContext context) {
    final inBottomBar = getViewerBottomBarTypes(context).toSet();
    return defaultViewerKebabMenuOrder
        .where(
          (type) =>
              !inBottomBar.contains(type) &&
              type.shouldShow(context) &&
              type.showsAt(ButtonPosition.kebabMenu, context),
        )
        .toList();
  }

  static List<Widget> buildViewerKebabMenu(ActionButtonContext context, BuildContext buildContext) {
    return getViewerKebabMenuTypes(context).toKebabMenuWidgets(context, buildContext);
  }

  static List<Widget> buildViewerBottomBar(ActionButtonContext context, BuildContext buildContext) {
    return getViewerBottomBarTypes(context).toBottomBarWidgets(context, buildContext);
  }
}

extension ActionButtonTypeListExtension on List<ActionButtonType> {
  List<Widget> toKebabMenuWidgets(ActionButtonContext context, BuildContext buildContext) {
    if (isEmpty) {
      return [];
    }

    final List<Widget> result = [];
    int? lastGroup;

    for (final type in this) {
      if (lastGroup != null && type.kebabMenuGroup != lastGroup) {
        result.add(const Divider(height: 1));
      }
      result.add(type.buildButton(context, buildContext, false, true));
      lastGroup = type.kebabMenuGroup;
    }

    return result;
  }

  List<Widget> toBottomBarWidgets(ActionButtonContext context, BuildContext buildContext) {
    return map((type) => type.buildButton(context, buildContext, false, false)).toList();
  }
}
