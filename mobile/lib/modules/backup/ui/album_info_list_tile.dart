import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

    buildImageFilter() {
      if (isSelected) {
        return selectedFilter;
      } else if (isExcluded) {
        return excludedFilter;
      } else {
        return unselectedFilter;
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
            child: Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                ColorFiltered(
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
                Visibility(
                  visible: isSelected,
                  child: Center(
                    child: Icon(
                      Icons.check_circle_outline,
                      color: Theme.of(context).primaryColor,
                      size: 40,
                    ),
                  ),
                )
              ],
            ),
          ),
        ),
        title: Text(
          albumInfo.name,
          style: TextStyle(
            fontSize: 14,
            color: isSelected ? Theme.of(context).primaryColor : null,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: FutureBuilder(
          builder: ((context, snapshot) {
            if (snapshot.hasData) {
              return Text(
                snapshot.data.toString() +
                    (albumInfo.isAll
                        ? " (${'backup_all'.tr()})"
                        : ""),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              );
            }
            return const Text("0");
          }),
          future: albumInfo.assetCount,
        ),
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
