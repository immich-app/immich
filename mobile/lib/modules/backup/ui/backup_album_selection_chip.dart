import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';

class BackupAlbumSelectionChip extends ConsumerWidget {
  final BackupAlbum backupAlbum;

  const BackupAlbumSelectionChip({
    required this.backupAlbum,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localAlbum = backupAlbum.album.value;
    if (localAlbum == null) {
      return const SizedBox.shrink();
    }

    void onTap() {
      ref.read(backupAlbumsProvider.notifier).deSelectAlbum(localAlbum);
    }

    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: Chip(
          label: Text(
            localAlbum.name,
            style: TextStyle(
              fontSize: 12,
              color: context.isDarkTheme ? Colors.black : immichBackgroundColor,
              fontWeight: FontWeight.bold,
            ),
          ),
          backgroundColor: switch (backupAlbum.selection) {
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
