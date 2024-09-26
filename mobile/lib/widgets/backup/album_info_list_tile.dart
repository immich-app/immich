import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/backup/available_album.model.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class AlbumInfoListTile extends HookConsumerWidget {
  final AvailableAlbum album;

  const AlbumInfoListTile({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isSelected =
        ref.watch(backupProvider).selectedBackupAlbums.contains(album);
    final bool isExcluded =
        ref.watch(backupProvider).excludedBackupAlbums.contains(album);
    final syncAlbum = ref
        .watch(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.syncAlbums);

    buildTileColor() {
      if (isSelected) {
        return context.isDarkTheme
            ? context.primaryColor.withAlpha(100)
            : context.primaryColor.withAlpha(25);
      } else if (isExcluded) {
        return context.isDarkTheme
            ? Colors.red[300]?.withAlpha(150)
            : Colors.red[100]?.withAlpha(150);
      } else {
        return Colors.transparent;
      }
    }

    buildIcon() {
      if (isSelected) {
        return Icon(
          Icons.check_circle_rounded,
          color: context.colorScheme.primary,
        );
      }

      if (isExcluded) {
        return Icon(
          Icons.remove_circle_rounded,
          color: context.colorScheme.error,
        );
      }

      return Icon(
        Icons.circle,
        color: context.colorScheme.surfaceContainerHighest,
      );
    }

    return GestureDetector(
      onDoubleTap: () {
        ref.watch(hapticFeedbackProvider.notifier).selectionClick();

        if (isExcluded) {
          // Remove from exclude album list
          ref.read(backupProvider.notifier).removeExcludedAlbumForBackup(album);
        } else {
          // Add to exclude album list

          if (album.id == 'isAll' || album.name == 'Recents') {
            ImmichToast.show(
              context: context,
              msg: 'Cannot exclude album contains all assets',
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
            return;
          }

          ref.read(backupProvider.notifier).addExcludedAlbumForBackup(album);
        }
      },
      child: ListTile(
        tileColor: buildTileColor(),
        contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        onTap: () {
          ref.read(hapticFeedbackProvider.notifier).selectionClick();
          if (isSelected) {
            ref.read(backupProvider.notifier).removeAlbumForBackup(album);
          } else {
            ref.read(backupProvider.notifier).addAlbumForBackup(album);
            if (syncAlbum) {
              ref.read(albumProvider.notifier).createSyncAlbum(album.name);
            }
          }
        },
        leading: buildIcon(),
        title: Text(
          album.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(album.assetCount.toString()),
        trailing: IconButton(
          onPressed: () {
            context.pushRoute(
              AlbumPreviewRoute(album: album.album),
            );
          },
          icon: Icon(
            Icons.image_outlined,
            color: context.primaryColor,
            size: 24,
          ),
          splashRadius: 25,
        ),
      ),
    );
  }
}
