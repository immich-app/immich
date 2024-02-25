import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupAlbumInfoListItem extends ConsumerWidget {
  final LocalAlbum album;

  const BackupAlbumInfoListItem({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupAlbums = ref.watch(backupAlbumsProvider);
    final backupAlbumNotifier = ref.read(backupAlbumsProvider.notifier);
    final isSelected =
        backupAlbums.value?.selectedBackupAlbums.any((a) => a.id == album.id) ??
            false;
    final isExcluded =
        backupAlbums.value?.excludedBackupAlbums.any((a) => a.id == album.id) ??
            false;
    final backupSelection = isSelected
        ? BackupSelection.select
        : isExcluded
            ? BackupSelection.exclude
            : BackupSelection.none;

    void onTap() {
      HapticFeedback.selectionClick();

      if (isSelected || isExcluded) {
        backupAlbumNotifier.deSelectAlbum(album);
      } else {
        backupAlbumNotifier.selectAlbumForBackup(album);
      }
    }

    void onDoubleTap() {
      HapticFeedback.selectionClick();

      if (isExcluded) {
        backupAlbumNotifier.deSelectAlbum(album);
      } else {
        if (album.id == LocalAlbum.isAllId || album.name == 'Recents') {
          ImmichToast.show(
            context: context,
            msg: 'Cannot exclude album contains all assets',
            toastType: ToastType.error,
            gravity: ToastGravity.BOTTOM,
          );
          return;
        }

        backupAlbumNotifier.excludeAlbumFromBackup(album);
      }
    }

    return GestureDetector(
      onTap: onTap,
      onDoubleTap: onDoubleTap,
      child: context.isMobile
          ? _AlbumDetailListTile(album, backupSelection)
          : _AlbumDetailCard(album, backupSelection),
    );
  }
}

class _AlbumFilteredThumbnail extends StatelessWidget {
  final Asset? thumbnail;
  final BackupSelection selection;

  const _AlbumFilteredThumbnail(this.thumbnail, this.selection);

  @override
  Widget build(BuildContext context) {
    ColorFilter selectedFilter = ColorFilter.mode(
      context.primaryColor.withAlpha(100),
      BlendMode.darken,
    );

    ColorFilter excludedFilter =
        ColorFilter.mode(Colors.red.withAlpha(75), BlendMode.darken);

    ColorFilter unselectedFilter =
        const ColorFilter.mode(Colors.black, BlendMode.color);

    return ColorFiltered(
      colorFilter: switch (selection) {
        BackupSelection.select => selectedFilter,
        BackupSelection.exclude => excludedFilter,
        BackupSelection.none => unselectedFilter,
      },
      child: ImmichImage(thumbnail),
    );
  }
}

/// Portrait list components

class _AlbumDetailListTile extends StatelessWidget {
  final LocalAlbum album;
  final BackupSelection selection;

  const _AlbumDetailListTile(this.album, this.selection);

  @override
  Widget build(BuildContext context) {
    // Wrapped ListTile with Material to prevent tileColor overflow
    // https://github.com/flutter/flutter/issues/86584
    return Material(
      type: MaterialType.transparency,
      child: ListTile(
        tileColor: switch (selection) {
          BackupSelection.select => context.isDarkTheme
              ? context.primaryColor.withAlpha(100)
              : context.primaryColor.withAlpha(25),
          BackupSelection.exclude => context.isDarkTheme
              ? Colors.red[300]?.withAlpha(150)
              : Colors.red[100]?.withAlpha(150),
          BackupSelection.none => Colors.transparent,
        },
        contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        leading: ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          child: SizedBox(
            height: 80,
            width: 80,
            child: _AlbumFilteredThumbnail(album.thumbnail, selection),
          ),
        ),
        title: Text(
          album.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(album.assetCount.toString()),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _AlbumDetailCardChip(selection),
            _AlbumPreviewButton(album),
          ],
        ),
      ),
    );
  }
}

/// Landscape card components

class _AlbumDetailCard extends StatelessWidget {
  final LocalAlbum album;
  final BackupSelection selection;

  const _AlbumDetailCard(this.album, this.selection);

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.hardEdge,
      margin: const EdgeInsets.all(1),
      shape: RoundedRectangleBorder(
        borderRadius:
            const BorderRadius.all(Radius.circular(12)), // if you need this
        side: BorderSide(
          color: context.isDarkTheme
              ? const Color.fromARGB(255, 37, 35, 35)
              : const Color(0xFFC9C9C9),
          width: 1,
        ),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                _AlbumFilteredThumbnail(
                  album.thumbnail,
                  selection,
                ),
                if (selection != BackupSelection.none)
                  Positioned(
                    bottom: 10,
                    right: 25,
                    child: _AlbumDetailCardChip(selection),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 25),
            child: _AlbumDetailCardDetails(album),
          ),
        ],
      ),
    );
  }
}

class _AlbumDetailCardChip extends StatelessWidget {
  final BackupSelection selection;

  const _AlbumDetailCardChip(this.selection);

  @override
  Widget build(BuildContext context) {
    if (selection == BackupSelection.none) {
      return const SizedBox();
    }

    return Chip(
      visualDensity: VisualDensity.compact,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(5)),
      ),
      label: Text(
        selection == BackupSelection.select
            ? "album_info_card_backup_album_included"
            : "album_info_card_backup_album_excluded",
        style: TextStyle(
          fontSize: 10,
          color: context.isDarkTheme ? Colors.black : Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      backgroundColor: selection == BackupSelection.select
          ? context.primaryColor
          : Colors.red[300],
    );
  }
}

class _AlbumDetailCardDetails extends StatelessWidget {
  final LocalAlbum album;

  const _AlbumDetailCardDetails(this.album);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                album.name,
                style: TextStyle(
                  fontSize: 14,
                  color: context.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 2.0),
                child: FutureBuilder(
                  builder: ((context, snapshot) {
                    if (snapshot.hasData) {
                      return Text(
                        album.assetCount.toString() +
                            (snapshot.data!.isAll
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
                  future: AssetPathEntity.fromId(album.id),
                ),
              ),
            ],
          ),
        ),
        _AlbumPreviewButton(album),
      ],
    );
  }
}

class _AlbumPreviewButton extends StatelessWidget {
  final LocalAlbum album;

  const _AlbumPreviewButton(this.album);

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => context.pushRoute(
        LocalAlbumViewerRoute(
          album: album,
          selectEnabled: false,
        ),
      ),
      icon: Icon(
        Icons.image_outlined,
        color: context.primaryColor,
        size: 24,
      ),
      splashRadius: 25,
    );
  }
}
