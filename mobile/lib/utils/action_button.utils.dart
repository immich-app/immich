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
import 'package:immich_mobile/extensions/translate_extensions.dart';
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
  });
}

enum ActionButtonType {
  advancedInfo,
  share,
  shareLink,
  similarPhotos,
  archive,
  unarchive,
  download,
  trash,
  deletePermanent,
  delete,
  moveToLockFolder,
  removeFromLockFolder,
  deleteLocal,
  upload,
  removeFromAlbum,
  unstack,
  likeActivity;

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
    };
  }

  Widget buildButton(ActionButtonContext context) {
    return switch (this) {
      ActionButtonType.advancedInfo => AdvancedInfoActionButton(source: context.source),
      ActionButtonType.share => ShareActionButton(source: context.source),
      ActionButtonType.shareLink => ShareLinkActionButton(source: context.source),
      ActionButtonType.archive => ArchiveActionButton(source: context.source),
      ActionButtonType.unarchive => UnArchiveActionButton(source: context.source),
      ActionButtonType.download => DownloadActionButton(source: context.source),
      ActionButtonType.trash => TrashActionButton(source: context.source),
      ActionButtonType.deletePermanent => DeletePermanentActionButton(source: context.source),
      ActionButtonType.delete => DeleteActionButton(source: context.source),
      ActionButtonType.moveToLockFolder => MoveToLockFolderActionButton(source: context.source),
      ActionButtonType.removeFromLockFolder => RemoveFromLockFolderActionButton(source: context.source),
      ActionButtonType.deleteLocal => DeleteLocalActionButton(source: context.source),
      ActionButtonType.upload => UploadActionButton(source: context.source),
      ActionButtonType.removeFromAlbum => RemoveFromAlbumActionButton(
        albumId: context.currentAlbum!.id,
        source: context.source,
      ),
      ActionButtonType.likeActivity => const LikeActivityActionButton(),
      ActionButtonType.unstack => UnStackActionButton(source: context.source),
      ActionButtonType.similarPhotos => SimilarPhotosActionButton(assetId: (context.asset as RemoteAsset).id),
    };
  }
}

class ActionButtonBuilder {
  static const List<ActionButtonType> _actionTypes = ActionButtonType.values;

  static List<Widget> build(ActionButtonContext context) {
    return _actionTypes.where((type) => type.shouldShow(context)).map((type) => type.buildButton(context)).toList();
  }
}

class ViewerKebabMenuButtonContext {
  final BaseAsset asset;
  final bool isOwner;
  final bool isCasting;
  final TimelineOrigin timelineOrigin;
  final ThemeData? originalTheme;

  const ViewerKebabMenuButtonContext({
    required this.asset,
    required this.isOwner,
    required this.isCasting,
    required this.timelineOrigin,
    this.originalTheme,
  });
}

enum ViewerKebabMenuButtonType {
  openInfo,
  viewInTimeline,
  cast,
  download;

  /// Defines which group each button belongs to.
  /// Buttons in the same group will be displayed together,
  /// with dividers separating different groups.
  int get group => switch (this) {
    ViewerKebabMenuButtonType.openInfo => 0,
    ViewerKebabMenuButtonType.viewInTimeline => 1,
    ViewerKebabMenuButtonType.cast => 1,
    ViewerKebabMenuButtonType.download => 1,
  };

  bool shouldShow(ViewerKebabMenuButtonContext context) {
    return switch (this) {
      ViewerKebabMenuButtonType.openInfo => true,
      ViewerKebabMenuButtonType.viewInTimeline =>
        context.timelineOrigin != TimelineOrigin.main &&
            context.timelineOrigin != TimelineOrigin.deepLink &&
            context.timelineOrigin != TimelineOrigin.trash &&
            context.timelineOrigin != TimelineOrigin.archive &&
            context.timelineOrigin != TimelineOrigin.localAlbum &&
            context.isOwner,
      ViewerKebabMenuButtonType.cast => context.isCasting || context.asset.hasRemote,
      ViewerKebabMenuButtonType.download => context.asset.isRemoteOnly,
    };
  }

  ConsumerWidget buildButton(ViewerKebabMenuButtonContext context, BuildContext buildContext) {
    return switch (this) {
      ViewerKebabMenuButtonType.openInfo => BaseActionButton(
        label: 'info'.tr(),
        iconData: Icons.info_outline,
        iconColor: context.originalTheme?.iconTheme.color,
        menuItem: true,
        onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent()),
      ),

      ViewerKebabMenuButtonType.viewInTimeline => BaseActionButton(
        label: 'view_in_timeline'.t(context: buildContext),
        iconData: Icons.image_search,
        iconColor: context.originalTheme?.iconTheme.color,
        menuItem: true,
        onPressed: () async {
          await buildContext.maybePop();
          await buildContext.navigateTo(const TabShellRoute(children: [MainTimelineRoute()]));
          EventStream.shared.emit(ScrollToDateEvent(context.asset.createdAt));
        },
      ),
      ViewerKebabMenuButtonType.cast => const CastActionButton(menuItem: true),
      ViewerKebabMenuButtonType.download => const DownloadActionButton(source: ActionSource.viewer, menuItem: true),
    };
  }
}

class ViewerKebabMenuButtonBuilder {
  static List<Widget> build(ViewerKebabMenuButtonContext context, BuildContext buildContext, WidgetRef ref) {
    final visibleButtons = ViewerKebabMenuButtonType.values.where((type) => type.shouldShow(context)).toList();

    if (visibleButtons.isEmpty) return [];

    final List<Widget> result = [];
    int? lastGroup;

    for (final type in visibleButtons) {
      if (lastGroup != null && type.group != lastGroup) {
        result.add(const Divider(height: 1));
      }
      result.add(type.buildButton(context, buildContext).build(buildContext, ref));
      lastGroup = type.group;
    }

    return result;
  }
}
