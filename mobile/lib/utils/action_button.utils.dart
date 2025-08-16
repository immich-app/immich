import 'package:flutter/widgets.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_album_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unarchive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class ActionButtonContext {
  final BaseAsset asset;
  final bool isOwner;
  final bool isArchived;
  final bool isTrashEnabled;
  final bool isInLockedView;
  final RemoteAlbum? currentAlbum;
  final ActionSource source;

  const ActionButtonContext({
    required this.asset,
    required this.isOwner,
    required this.isArchived,
    required this.isTrashEnabled,
    required this.isInLockedView,
    required this.currentAlbum,
    required this.source,
  });
}

abstract class ActionButtonRule {
  bool shouldShow(ActionButtonContext context);
  Widget buildButton(ActionButtonContext context);
}

class ShareActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return !context.isInLockedView;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return ShareActionButton(source: context.source);
  }
}

class ShareLinkActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return !context.isInLockedView && //
        context.asset.hasRemote;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return ShareLinkActionButton(source: context.source);
  }
}

class ArchiveActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.asset.hasRemote && //
        !context.isArchived;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return ArchiveActionButton(source: context.source);
  }
}

class UnarchiveActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.asset.hasRemote && //
        context.isArchived;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return UnArchiveActionButton(source: context.source);
  }
}

class DownloadActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return !context.isInLockedView && //
        context.asset.hasRemote && //
        !context.asset.hasLocal;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return DownloadActionButton(source: context.source);
  }
}

class TrashActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.asset.hasRemote && //
        context.isTrashEnabled;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return TrashActionButton(source: context.source);
  }
}

class DeletePermanentActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.asset.hasRemote && //
        !context.isTrashEnabled;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return DeletePermanentActionButton(source: context.source);
  }
}

class DeleteActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.asset.hasRemote;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return DeleteActionButton(source: context.source);
  }
}

class MoveToLockFolderActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.asset.hasRemote;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return MoveToLockFolderActionButton(source: context.source);
  }
}

class DeleteLocalActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return !context.isInLockedView && //
        context.asset.storage == AssetState.local;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return DeleteLocalActionButton(source: context.source);
  }
}

class UploadActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return !context.isInLockedView && //
        context.asset.storage == AssetState.local;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return UploadActionButton(source: context.source);
  }
}

class RemoveFromAlbumActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return context.isOwner && //
        !context.isInLockedView && //
        context.currentAlbum != null;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return RemoveFromAlbumActionButton(albumId: context.currentAlbum!.id, source: context.source);
  }
}

class LikeActivityActionRule extends ActionButtonRule {
  @override
  bool shouldShow(ActionButtonContext context) {
    return !context.isInLockedView && //
        context.currentAlbum != null && //
        context.currentAlbum!.isActivityEnabled && //
        context.currentAlbum!.isShared;
  }

  @override
  Widget buildButton(ActionButtonContext context) {
    return const LikeActivityActionButton();
  }
}

class ActionButtonBuilder {
  static final List<ActionButtonRule> _rules = [
    ShareActionRule(),
    ShareLinkActionRule(),
    LikeActivityActionRule(),
    ArchiveActionRule(),
    UnarchiveActionRule(),
    DownloadActionRule(),
    TrashActionRule(),
    DeletePermanentActionRule(),
    DeleteActionRule(),
    MoveToLockFolderActionRule(),
    DeleteLocalActionRule(),
    UploadActionRule(),
    RemoveFromAlbumActionRule(),
  ];

  static List<Widget> build(ActionButtonContext context) {
    return _rules
        .where((rule) => rule.shouldShow(context)) //
        .map((rule) => rule.buildButton(context)) //
        .toList();
  }
}
