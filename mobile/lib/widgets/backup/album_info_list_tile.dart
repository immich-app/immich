import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/backup/available_album.model.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

const double previewWidth = 60;
const double previewHeight = 60;

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

    final isDarkTheme = context.isDarkTheme;
    
    final previewAsset = useState<Asset?>(null);
    getPreviewAsset() async {
      var assets = await ref.read(albumMediaRepositoryProvider).getAssets(
            album.album.localId!,
            start: 0,
            end: 1,
          );
      if (context.mounted && assets.isNotEmpty) {
        previewAsset.value = assets[0];
      }
    }

    useEffect(
      () {
        getPreviewAsset();
        return null;
      },
      [],
    );

    ColorFilter selectedFilter = ColorFilter.mode(
      context.primaryColor.withAlpha(100),
      BlendMode.darken,
    );
    ColorFilter excludedFilter =
        ColorFilter.mode(Colors.red.withAlpha(75), BlendMode.darken);
    ColorFilter? noFilter =
        const ColorFilter.mode(Colors.black, BlendMode.dst);
    ColorFilter? unselectedFilter=
        const ColorFilter.mode(Colors.black, BlendMode.color);


    buildImageFilter(bool hasImage) {
      if (isSelected) {
        return selectedFilter;
      } else if (isExcluded) {
        return excludedFilter;
      } else {
        return hasImage ? noFilter : unselectedFilter;
      }
    }

    buildSelectedTextBox() {
      if (isSelected) {
        return Chip(
          visualDensity: VisualDensity.compact,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
          label: Text(
            "album_info_card_backup_album_included",
            style: TextStyle(
              fontSize: 10,
              color: isDarkTheme ? Colors.black : Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
          backgroundColor: context.primaryColor,
        );
      } else if (isExcluded) {
        return Chip(
          visualDensity: VisualDensity.compact,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
          label: Text(
            "album_info_card_backup_album_excluded",
            style: TextStyle(
              fontSize: 10,
              color: isDarkTheme ? Colors.black : Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
          backgroundColor: Colors.red[300],
        );
      }

      return const SizedBox();
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

    buildImage() {
      return ColorFiltered(
        colorFilter: buildImageFilter(previewAsset.value != null),
        child: previewAsset.value != null
            ? ImmichThumbnail(
                asset: previewAsset.value,
                width: previewWidth,
                height: previewHeight,
                fit: BoxFit.cover,
              )
            : const Image(
                width: previewWidth,
                height: previewHeight,
                image: AssetImage(
                  'assets/immich-logo.png',
                ),
                fit: BoxFit.cover,
              ),
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
        leading: buildImage(),
        title: Text(
          album.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(album.assetCount.toString()),
        trailing: 
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            buildSelectedTextBox(),
            IconButton(
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
          ],
        ),
      ),
    );
  }
}
