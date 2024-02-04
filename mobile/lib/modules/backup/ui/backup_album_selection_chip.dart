import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';

class BackupAlbumSelectionChip extends ConsumerWidget {
  final LocalAlbum album;

  const BackupAlbumSelectionChip({
    required this.album,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void onTap() {
      return ref
          .read(backupAlbumsProvider.notifier)
          .removeAlbumForBackup(album);
    }

    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: Chip(
          label: Text(
            album.name,
            style: TextStyle(
              fontSize: 12,
              color: context.isDarkTheme ? Colors.black : immichBackgroundColor,
              fontWeight: FontWeight.bold,
            ),
          ),
          backgroundColor: switch (album.backupSelection) {
            BackupSelection.select => context.primaryColor,
            BackupSelection.exclude => Colors.red[300],
            BackupSelection.none => Colors.transparent
          },
          deleteIconColor:
              context.isDarkTheme ? Colors.black : immichBackgroundColor,
          deleteIcon: const Icon(
            Icons.cancel_rounded,
            size: 15,
          ),
          onDeleted: onTap,
        ),
      ),
    );
  }
}
