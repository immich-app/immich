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
    this.iconColor,
    this.iconShadows,
  });

  final VoidCallback? onAddPhotos;
  final VoidCallback? onAddUsers;
  final VoidCallback? onDeleteAlbum;
  final VoidCallback? onLeaveAlbum;
  final VoidCallback? onCreateSharedLink;
  final VoidCallback? onToggleAlbumOrder;
  final VoidCallback? onEditAlbum;
  final VoidCallback? onShowOptions;
  final Color? iconColor;
  final List<Shadow>? iconShadows;

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
          menuItem: true,
        ),
      );
    }

    if (onAddPhotos != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'add_photos'.t(context: context),
          iconData: Icons.add_a_photo,
          onPressed: onAddPhotos,
          menuItem: true,
        ),
      );
    }

    if (onAddUsers != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'album_viewer_page_share_add_users'.t(context: context),
          iconData: Icons.group_add,
          onPressed: onAddUsers,
          menuItem: true,
        ),
      );
    }

    if (onLeaveAlbum != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'leave_album'.t(context: context),
          iconData: Icons.person_remove_rounded,
          onPressed: onLeaveAlbum,
          menuItem: true,
        ),
      );
    }

    if (onToggleAlbumOrder != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'change_display_order'.t(context: context),
          iconData: Icons.swap_vert_rounded,
          onPressed: onToggleAlbumOrder,
          menuItem: true,
        ),
      );
    }

    if (onCreateSharedLink != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'create_shared_link'.t(context: context),
          iconData: Icons.link,
          onPressed: onCreateSharedLink,
          menuItem: true,
        ),
      );
    }

    if (onShowOptions != null) {
      menuChildren.add(
        BaseActionButton(
          label: 'options'.t(context: context),
          iconData: Icons.settings,
          onPressed: onShowOptions,
          menuItem: true,
        ),
      );
    }

    if (onDeleteAlbum != null) {
      menuChildren.add(const Divider(height: 1));
      menuChildren.add(
        BaseActionButton(
          label: 'delete_album'.t(context: context),
          iconData: Icons.delete,
          iconColor: context.isDarkTheme ? Colors.red[400] : Colors.red[800],
          onPressed: onDeleteAlbum,
          menuItem: true,
        ),
      );
    }

    return MenuAnchor(
      consumeOutsideTap: true,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(theme.scaffoldBackgroundColor),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.grey),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 6)),
      ),
      menuChildren: [
        ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 150),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: menuChildren,
          ),
        ),
      ],
      builder: (context, controller, child) {
        return IconButton(
          icon: Icon(Icons.more_vert_rounded, color: iconColor ?? Colors.white, shadows: iconShadows),
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
        );
      },
    );
  }
}
