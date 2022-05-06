import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/ui/album_info_card.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final availableAlbums = ref.watch(backupProvider).availableAlbums;
    final selectedBackupAlbums = ref.watch(backupProvider).selectedBackupAlbums;
    final excludedBackupAlbums = ref.watch(backupProvider).excludedBackupAlbums;

    useEffect(() {
      ref.read(backupProvider.notifier).getBackupAlbumsInfo();
      return null;
    }, []);

    _buildAlbumSelectionList() {
      if (availableAlbums.isEmpty) {
        return const Center(
          child: ImmichLoadingIndicator(),
        );
      }

      return SizedBox(
        height: 265,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: availableAlbums.length,
          physics: const BouncingScrollPhysics(),
          itemBuilder: ((context, index) {
            var thumbnailData = availableAlbums[index].thumbnailData;
            return Padding(
              padding: index == 0 ? const EdgeInsets.only(left: 16.00) : const EdgeInsets.all(0),
              child: AlbumInfoCard(imageData: thumbnailData, albumInfo: availableAlbums[index].albumEntity),
            );
          }),
        ),
      );
    }

    _buildSelectedAlbumNameChip() {
      return selectedBackupAlbums.map((album) {
        void removeSelection() {
          if (ref.watch(backupProvider).selectedBackupAlbums.length == 1) {
            ImmichToast.show(
              context: context,
              msg: "Cannot remove the only album",
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
            return;
          }

          ref.watch(backupProvider.notifier).removeAlbumForBackup(album);
        }

        return Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: GestureDetector(
            onTap: removeSelection,
            child: Chip(
              visualDensity: VisualDensity.compact,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
              label: Text(
                album.name,
                style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
              ),
              backgroundColor: Theme.of(context).primaryColor,
              deleteIconColor: Colors.white,
              deleteIcon: const Icon(
                Icons.cancel_rounded,
                size: 15,
              ),
              onDeleted: removeSelection,
            ),
          ),
        );
      }).toSet();
    }

    _buildExcludedAlbumNameChip() {
      return excludedBackupAlbums.map((album) {
        void removeSelection() {
          ref.watch(backupProvider.notifier).removeExcludedAlbumForBackup(album);
        }

        return GestureDetector(
          onTap: removeSelection,
          child: Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Chip(
              visualDensity: VisualDensity.compact,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
              label: Text(
                album.name,
                style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
              ),
              backgroundColor: Colors.red[300],
              deleteIconColor: Colors.white,
              deleteIcon: const Icon(
                Icons.cancel_rounded,
                size: 15,
              ),
              onDeleted: removeSelection,
            ),
          ),
        );
      }).toSet();
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        title: const Text(
          "Select Albums",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
      ),
      body: ListView(
        physics: const ClampingScrollPhysics(),
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
            child: Text(
              "Selection Info",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
          // Selected Album Chips

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Wrap(
              children: [..._buildSelectedAlbumNameChip(), ..._buildExcludedAlbumNameChip()],
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
            child: Card(
              margin: const EdgeInsets.all(0),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(5), // if you need this
                side: const BorderSide(
                  color: Color.fromARGB(255, 235, 235, 235),
                  width: 1,
                ),
              ),
              elevation: 0,
              borderOnForeground: false,
              child: Column(
                children: [
                  ListTile(
                    visualDensity: VisualDensity.compact,
                    title: Text(
                      "Total unique assets",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[700]),
                    ),
                    trailing: Text(
                      ref.watch(backupProvider).allUniqueAssets.length.toString(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),

          ListTile(
            title: Text(
              "Albums on device (${availableAlbums.length.toString()})",
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Text(
                "Tap to include, double tap to exclude",
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            trailing: IconButton(
              splashRadius: 16,
              icon: Icon(
                Icons.info,
                size: 20,
                color: Theme.of(context).primaryColor,
              ),
              onPressed: () {
                // show the dialog
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 5,
                      title: Text(
                        'Selection Info',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                      content: SingleChildScrollView(
                        child: ListBody(
                          children: [
                            Text(
                              'Assets can scatter across multiple albums. Thus, albums can be included or excluded during the backup process.',
                              style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: _buildAlbumSelectionList(),
          ),
        ],
      ),
    );
  }
}
