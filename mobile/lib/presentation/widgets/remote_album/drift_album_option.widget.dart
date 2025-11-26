import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class DriftRemoteAlbumOption extends ConsumerWidget {
  const DriftRemoteAlbumOption({
    super.key,
    this.onAddPhotos,
    this.onAddUsers,
    this.onDeleteAlbum,
    this.onLeaveAlbum,
    this.onCreateSharedLink,
    this.onToggleAlbumOrder,
    this.onEditAlbum,
    this.onShowOptions,
  });

  final VoidCallback? onAddPhotos;
  final VoidCallback? onAddUsers;
  final VoidCallback? onDeleteAlbum;
  final VoidCallback? onLeaveAlbum;
  final VoidCallback? onCreateSharedLink;
  final VoidCallback? onToggleAlbumOrder;
  final VoidCallback? onEditAlbum;
  final VoidCallback? onShowOptions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = context.themeData;
    final menuChildren = <Widget>[];

    if (onEditAlbum != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'edit_album'.t(context: context),
          iconData: Icons.edit,
          onPressed: onEditAlbum,
        ),
      );
    }

    if (onAddPhotos != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'add_photos'.t(context: context),
          iconData: Icons.add_a_photo,
          onPressed: onAddPhotos,
        ),
      );
    }

    if (onAddUsers != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'album_viewer_page_share_add_users'.t(context: context),
          iconData: Icons.group_add,
          onPressed: onAddUsers,
        ),
      );
    }

    if (onLeaveAlbum != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'leave_album'.t(context: context),
          iconData: Icons.person_remove_rounded,
          onPressed: onLeaveAlbum,
        ),
      );
    }

    if (onToggleAlbumOrder != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'change_display_order'.t(context: context),
          iconData: Icons.swap_vert_rounded,
          onPressed: onToggleAlbumOrder,
        ),
      );
    }

    if (onCreateSharedLink != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'create_shared_link'.t(context: context),
          iconData: Icons.link,
          onPressed: onCreateSharedLink,
        ),
      );
    }

    if (onShowOptions != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'options'.t(context: context),
          iconData: Icons.settings,
          onPressed: onShowOptions,
        ),
      );
    }

    if (onDeleteAlbum != null) {
      // final deleteColor = context.isDarkTheme ? Colors.red[400] : Colors.red[800];
      menuChildren.add(
        BaseActionButton(
          label: 'delete_album'.t(context: context),
          iconData: Icons.delete,
          // iconColor: deleteColor,
          onPressed: onDeleteAlbum,
        ),
      );
    }

    return MenuAnchor(
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(theme.scaffoldBackgroundColor),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 2)),
      ),
      menuChildren: menuChildren.expand((widget) => [const Divider(height: 0), widget]).toList(),
      builder: (context, controller, child) {
        return IconButton(
          icon: const Icon(Icons.more_vert_rounded),
          onPressed: () {
            if (controller.isOpen) {
              controller.close();
            } else {
              controller.open();
            }
          },
        );
      },
    );
  }
}
