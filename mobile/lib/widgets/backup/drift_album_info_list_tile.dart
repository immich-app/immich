import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class DriftAlbumInfoListTile extends HookConsumerWidget {
  final LocalAlbum album;

  const DriftAlbumInfoListTile({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isSelected = album.backupSelection == BackupSelection.selected;
    final bool isExcluded = album.backupSelection == BackupSelection.excluded;

    buildTileColor() {
      if (isSelected) {
        return context.isDarkTheme ? context.primaryColor.withAlpha(100) : context.primaryColor.withAlpha(25);
      } else if (isExcluded) {
        return context.isDarkTheme ? Colors.red[300]?.withAlpha(150) : Colors.red[100]?.withAlpha(150);
      } else {
        return Colors.transparent;
      }
    }

    buildIcon() {
      if (isSelected) {
        return Icon(Icons.check_circle_rounded, color: context.colorScheme.primary);
      }

      if (isExcluded) {
        return Icon(Icons.remove_circle_rounded, color: context.colorScheme.error);
      }

      return Icon(Icons.circle, color: context.colorScheme.surfaceContainerHighest);
    }

    return GestureDetector(
      onDoubleTap: () {
        ref.watch(hapticFeedbackProvider.notifier).selectionClick();

        if (isExcluded) {
          ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
        } else {
          if (album.id == 'isAll' || album.name == 'Recents') {
            ImmichToast.show(
              context: context,
              msg: 'Cannot exclude album contains all assets',
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
            return;
          }

          ref.read(backupAlbumProvider.notifier).excludeAlbum(album);
        }
      },
      child: ListTile(
        tileColor: buildTileColor(),
        contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        onTap: () {
          ref.read(hapticFeedbackProvider.notifier).selectionClick();
          if (isSelected) {
            ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
          } else {
            ref.read(backupAlbumProvider.notifier).selectAlbum(album);
          }
        },
        leading: buildIcon(),
        title: Text(album.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        subtitle: Text(album.assetCount.toString()),
        trailing: IconButton(
          onPressed: () {
            context.pushRoute(LocalTimelineRoute(album: album));
          },
          icon: Icon(Icons.image_outlined, color: context.primaryColor, size: 24),
          splashRadius: 25,
        ),
      ),
    );
  }
}
