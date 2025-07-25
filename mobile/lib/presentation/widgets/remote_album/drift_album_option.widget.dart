import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

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
  });

  final VoidCallback? onAddPhotos;
  final VoidCallback? onAddUsers;
  final VoidCallback? onDeleteAlbum;
  final VoidCallback? onLeaveAlbum;
  final VoidCallback? onCreateSharedLink;
  final VoidCallback? onToggleAlbumOrder;
  final VoidCallback? onEditAlbum;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    TextStyle textStyle = Theme.of(context).textTheme.bodyLarge!.copyWith(
          fontWeight: FontWeight.w600,
        );

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 24.0),
        child: ListView(
          shrinkWrap: true,
          children: [
            if (onEditAlbum != null)
              ListTile(
                leading: const Icon(Icons.edit),
                title: Text(
                  'edit_album'.t(context: context),
                  style: textStyle,
                ),
                onTap: onEditAlbum,
              ),
            if (onAddPhotos != null)
              ListTile(
                leading: const Icon(Icons.add_a_photo),
                title: Text(
                  'add_photos'.t(context: context),
                  style: textStyle,
                ),
                onTap: onAddPhotos,
              ),
            if (onAddUsers != null)
              ListTile(
                leading: const Icon(Icons.group_add),
                title: Text(
                  'album_viewer_page_share_add_users'.t(context: context),
                  style: textStyle,
                ),
                onTap: onAddUsers,
              ),
            if (onLeaveAlbum != null)
              ListTile(
                leading: const Icon(Icons.person_remove_rounded),
                title: Text(
                  'leave_album'.t(context: context),
                  style: textStyle,
                ),
                onTap: onLeaveAlbum,
              ),
            if (onToggleAlbumOrder != null)
              ListTile(
                leading: const Icon(Icons.swap_vert_rounded),
                title: Text(
                  'change_display_order'.t(context: context),
                  style: textStyle,
                ),
                onTap: onToggleAlbumOrder,
              ),
            if (onCreateSharedLink != null)
              ListTile(
                leading: const Icon(Icons.link),
                title: Text(
                  'create_shared_link'.t(context: context),
                  style: textStyle,
                ),
                onTap: onCreateSharedLink,
              ),
            if (onDeleteAlbum != null) ...[
              const Divider(
                indent: 16,
                endIndent: 16,
              ),
              ListTile(
                leading: Icon(
                  Icons.delete,
                  color:
                      context.isDarkTheme ? Colors.red[400] : Colors.red[800],
                ),
                title: Text(
                  'delete_album'.t(context: context),
                  style: textStyle.copyWith(
                    color:
                        context.isDarkTheme ? Colors.red[400] : Colors.red[800],
                  ),
                ),
                onTap: onDeleteAlbum,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
