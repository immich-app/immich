import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/available_album.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class AlbumInfoListTile extends HookConsumerWidget {
  final Uint8List? imageData;
  final AvailableAlbum albumInfo;

  const AlbumInfoListTile({Key? key, this.imageData, required this.albumInfo})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isSelected =
        ref.watch(backupProvider).selectedBackupAlbums.contains(albumInfo);
    final bool isExcluded =
        ref.watch(backupProvider).excludedBackupAlbums.contains(albumInfo);

    ColorFilter selectedFilter = ColorFilter.mode(
      Theme.of(context).primaryColor.withAlpha(100),
      BlendMode.darken,
    );
    ColorFilter excludedFilter =
        ColorFilter.mode(Colors.red.withAlpha(75), BlendMode.darken);
    ColorFilter unselectedFilter =
        const ColorFilter.mode(Colors.black, BlendMode.color);
    var isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    var assetCount = useState(0);

    useEffect(
      () {
        albumInfo.assetCount.then((value) => assetCount.value = value);
        return null;
      },
      [albumInfo],
    );

    buildImageFilter() {
      if (isSelected) {
        return selectedFilter;
      } else if (isExcluded) {
        return excludedFilter;
      } else {
        return unselectedFilter;
      }
    }

    buildTileColor() {
      if (isSelected) {
        return isDarkTheme
            ? Theme.of(context).primaryColor.withAlpha(100)
            : Theme.of(context).primaryColor.withAlpha(25);
      } else if (isExcluded) {
        return isDarkTheme
            ? Colors.red[300]?.withAlpha(150)
            : Colors.red[100]?.withAlpha(150);
      } else {
        return Colors.transparent;
      }
    }

    return GestureDetector(
      onDoubleTap: () {
        HapticFeedback.selectionClick();

        if (isExcluded) {
          // Remove from exclude album list
          ref
              .watch(backupProvider.notifier)
              .removeExcludedAlbumForBackup(albumInfo);
        } else {
          // Add to exclude album list
          if (ref.watch(backupProvider).selectedBackupAlbums.length == 1 &&
              ref
                  .watch(backupProvider)
                  .selectedBackupAlbums
                  .contains(albumInfo)) {
            ImmichToast.show(
              context: context,
              msg: "backup_err_only_album".tr(),
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
            return;
          }

          if (albumInfo.id == 'isAll' || albumInfo.name == 'Recents') {
            ImmichToast.show(
              context: context,
              msg: 'Cannot exclude album contains all assets',
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
            return;
          }

          ref
              .watch(backupProvider.notifier)
              .addExcludedAlbumForBackup(albumInfo);
        }
      },
      child: ListTile(
        tileColor: buildTileColor(),
        contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        onTap: () {
          HapticFeedback.selectionClick();
          if (isSelected) {
            if (ref.watch(backupProvider).selectedBackupAlbums.length == 1) {
              ImmichToast.show(
                context: context,
                msg: "backup_err_only_album".tr(),
                toastType: ToastType.error,
                gravity: ToastGravity.BOTTOM,
              );
              return;
            }

            ref.watch(backupProvider.notifier).removeAlbumForBackup(albumInfo);
          } else {
            ref.watch(backupProvider.notifier).addAlbumForBackup(albumInfo);
          }
        },
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 80,
            width: 80,
            child: ColorFiltered(
              colorFilter: buildImageFilter(),
              child: Image(
                width: double.infinity,
                height: double.infinity,
                image: imageData != null
                    ? MemoryImage(imageData!)
                    : const AssetImage(
                        'assets/immich-logo-no-outline.png',
                      ) as ImageProvider,
                fit: BoxFit.cover,
              ),
            ),
          ),
        ),
        title: Text(
          albumInfo.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(assetCount.value.toString()),
        trailing: IconButton(
          onPressed: () {
            AutoRouter.of(context).push(
              AlbumPreviewRoute(album: albumInfo.albumEntity),
            );
          },
          icon: Icon(
            Icons.image_outlined,
            color: Theme.of(context).primaryColor,
            size: 24,
          ),
          splashRadius: 25,
        ),
      ),
    );
  }
}
