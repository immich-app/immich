import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
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
      context.primaryColor.withAlpha(100),
      BlendMode.darken,
    );
    ColorFilter excludedFilter =
        ColorFilter.mode(Colors.red.withAlpha(75), BlendMode.darken);
    ColorFilter unselectedFilter =
        const ColorFilter.mode(Colors.black, BlendMode.color);

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

    return GestureDetector(
      onDoubleTap: () {
        HapticFeedback.selectionClick();

        if (isExcluded) {
          // Remove from exclude album list
          ref
              .read(backupProvider.notifier)
              .removeExcludedAlbumForBackup(albumInfo);
        } else {
          // Add to exclude album list

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
              .read(backupProvider.notifier)
              .addExcludedAlbumForBackup(albumInfo);
        }
      },
      child: ListTile(
        tileColor: buildTileColor(),
        contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        onTap: () {
          HapticFeedback.selectionClick();
          if (isSelected) {
            ref.read(backupProvider.notifier).removeAlbumForBackup(albumInfo);
          } else {
            ref.read(backupProvider.notifier).addAlbumForBackup(albumInfo);
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
            context.autoPush(
              AlbumPreviewRoute(album: albumInfo.albumEntity),
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
