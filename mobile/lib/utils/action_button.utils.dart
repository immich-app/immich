import 'package:flutter/widgets.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/advanced_info_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/keep_on_device_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_album_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/similar_photos_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unarchive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unstack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';

class ActionButtonContext {
  final BaseAsset asset;
  final bool isOwner;
  final bool isArchived;
  final bool isTrashEnabled;
  final bool isInLockedView;
  final bool isStacked;
  final RemoteAlbum? currentAlbum;
  final bool advancedTroubleshooting;
  final bool isWaitingForTrashApproval;
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
    required this.isWaitingForTrashApproval,
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
  likeActivity,
  keepOnDevice,
  syncTrash;

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
            !context.isArchived &&
            !context.isWaitingForTrashApproval,
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
            context.isTrashEnabled &&
            !context.isWaitingForTrashApproval,
      ActionButtonType.deletePermanent =>
        context.isOwner && //
                context.asset.hasRemote && //
                !context.isTrashEnabled ||
            context.isInLockedView && !context.isWaitingForTrashApproval,
      ActionButtonType.delete =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote &&
            !context.isWaitingForTrashApproval,
      ActionButtonType.moveToLockFolder =>
        context.isOwner && //
            !context.isInLockedView && //
            context.asset.hasRemote &&
            !context.isWaitingForTrashApproval,
      ActionButtonType.removeFromLockFolder =>
        context.isOwner && //
            context.isInLockedView && //
            context.asset.hasRemote,
      ActionButtonType.deleteLocal =>
        !context.isInLockedView && //
            context.asset.hasLocal &&
            !context.isWaitingForTrashApproval,
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
      ActionButtonType.keepOnDevice => context.isWaitingForTrashApproval,
      ActionButtonType.syncTrash => context.isWaitingForTrashApproval,
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
      ActionButtonType.keepOnDevice => const KeepOnDeviceActionButton(source: ActionSource.viewer, isPreview: true),
      ActionButtonType.syncTrash => const MoveToTrashActionButton(source: ActionSource.viewer, isPreview: true),
    };
  }
}

class ActionButtonBuilder {
  static const List<ActionButtonType> _actionTypes = ActionButtonType.values;

  static List<Widget> build(ActionButtonContext context) {
    return _actionTypes.where((type) => type.shouldShow(context)).map((type) => type.buildButton(context)).toList();
  }
}
