import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

extension ActionButtonTypeVisuals on ActionButtonType {
  IconData get iconData {
    return switch (this) {
      ActionButtonType.advancedInfo => Icons.help_outline_rounded,
      ActionButtonType.share => Icons.share_rounded,
      ActionButtonType.edit => Icons.tune,
      ActionButtonType.add => Icons.add,
      ActionButtonType.shareLink => Icons.link_rounded,
      ActionButtonType.similarPhotos => Icons.compare,
      ActionButtonType.archive => Icons.archive_outlined,
      ActionButtonType.unarchive => Icons.unarchive_outlined,
      ActionButtonType.download => Icons.download,
      ActionButtonType.trash => Icons.delete_outline_rounded,
      ActionButtonType.deletePermanent => Icons.delete_forever,
      ActionButtonType.delete => Icons.delete_sweep_outlined,
      ActionButtonType.moveToLockFolder => Icons.lock_outline_rounded,
      ActionButtonType.removeFromLockFolder => Icons.lock_open_rounded,
      ActionButtonType.deleteLocal => Icons.no_cell_outlined,
      ActionButtonType.upload => Icons.backup_outlined,
      ActionButtonType.removeFromAlbum => Icons.remove_circle_outline,
      ActionButtonType.unstack => Icons.layers_clear_outlined,
      ActionButtonType.likeActivity => Icons.favorite_border,
    };
  }

  String get _labelKey {
    return switch (this) {
      ActionButtonType.advancedInfo => 'troubleshoot',
      ActionButtonType.share => 'share',
      ActionButtonType.edit => 'edit',
      ActionButtonType.add => 'add_to_bottom_bar',
      ActionButtonType.shareLink => 'share_link',
      ActionButtonType.similarPhotos => 'view_similar_photos',
      ActionButtonType.archive => 'to_archive',
      ActionButtonType.unarchive => 'unarchive',
      ActionButtonType.download => 'download',
      ActionButtonType.trash => 'control_bottom_app_bar_trash_from_immich',
      ActionButtonType.deletePermanent => 'delete_permanently',
      ActionButtonType.delete => 'delete',
      ActionButtonType.moveToLockFolder => 'move_to_locked_folder',
      ActionButtonType.removeFromLockFolder => 'remove_from_locked_folder',
      ActionButtonType.deleteLocal => 'control_bottom_app_bar_delete_from_local',
      ActionButtonType.upload => 'upload',
      ActionButtonType.removeFromAlbum => 'remove_from_album',
      ActionButtonType.unstack => 'unstack',
      ActionButtonType.likeActivity => 'like',
    };
  }

  String localizedLabel(BuildContext _) => _labelKey.tr();
}
