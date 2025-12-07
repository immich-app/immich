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
import 'package:immich_mobile/presentation/widgets/action_buttons/advanced_info_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/cast_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_album_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/similar_photos_action_button.widget.dart';
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
  final ThemeData? originalTheme;

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
    this.originalTheme,
  });
}

enum ActionButtonType {
  openInfo,
  likeActivity,
  share,
  shareLink,
  cast,
  similarPhotos,
  viewInTimeline,
  download,
  upload,
  unstack,
  archive,
  unarchive,
  moveToLockFolder,
  removeFromLockFolder,
  removeFromAlbum,
  trash,
  deleteLocal,
  deletePermanent,
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
      ActionButtonType.trash =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote && //
            context.isTrashEnabled,
      ActionButtonType.deletePermanent =>
        context.isOwner && //
                context.asset.hasRemote && //
                !context.isTrashEnabled ||
            context.isInLockedView,
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
      ActionButtonType.unstack =>
        context.isOwner && //
            !context.isInLockedView && //
            context.isStacked,
      ActionButtonType.likeActivity =>
        !context.isInLockedView &&
            context.currentAlbum != null &&
            context.currentAlbum!.isActivityEnabled &&
            context.currentAlbum!.isShared,
      ActionButtonType.similarPhotos =>
        !context.isInLockedView && //
            context.asset is RemoteAsset,
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
    };
  }

  ConsumerWidget buildButton(
    ActionButtonContext context, [
    BuildContext? buildContext,
    bool iconOnly = false,
    bool menuItem = false,
  ]) {
    return switch (this) {
      ActionButtonType.advancedInfo => AdvancedInfoActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.share => ShareActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.shareLink => ShareLinkActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.archive => ArchiveActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.unarchive => UnArchiveActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.download => DownloadActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.trash => TrashActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.deletePermanent => DeletePermanentActionButton(
        source: context.source,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.delete => DeleteActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
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
      ActionButtonType.likeActivity => LikeActivityActionButton(iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.unstack => UnStackActionButton(source: context.source, iconOnly: iconOnly, menuItem: menuItem),
      ActionButtonType.similarPhotos => SimilarPhotosActionButton(
        assetId: (context.asset as RemoteAsset).id,
        iconOnly: iconOnly,
        menuItem: menuItem,
      ),
      ActionButtonType.openInfo => BaseActionButton(
        label: 'info'.tr(),
        iconData: Icons.info_outline,
        iconColor: context.originalTheme?.iconTheme.color,
        menuItem: true,
        onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent()),
      ),
      ActionButtonType.viewInTimeline => BaseActionButton(
        label: 'view_in_timeline'.tr(),
        iconData: Icons.image_search,
        iconColor: context.originalTheme?.iconTheme.color,
        iconOnly: iconOnly,
        menuItem: menuItem,
        onPressed: buildContext == null
            ? null
            : () async {
                await buildContext.maybePop();
                await buildContext.navigateTo(const TabShellRoute(children: [MainTimelineRoute()]));
                EventStream.shared.emit(ScrollToDateEvent(context.asset.createdAt));
              },
      ),
      ActionButtonType.cast => CastActionButton(iconOnly: iconOnly, menuItem: menuItem),
    };
  }

  /// Defines which group each button belongs to for kebab menu.
  /// Buttons in the same group will be displayed together,
  /// with dividers separating different groups.
  int get kebabMenuGroup => switch (this) {
    // 0: info
    ActionButtonType.openInfo => 0,
    // 10: move,remove, and delete
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
  };

  static List<Widget> build(ActionButtonContext context) {
    return _actionTypes.where((type) => type.shouldShow(context)).map((type) => type.buildButton(context)).toList();
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
      result.add(type.buildButton(context, buildContext, false, true).build(buildContext, ref));
      lastGroup = type.kebabMenuGroup;
    }

    return result;
  }
}
