import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/ui/album_info_card.dart';

class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final availableAlbums = ref.watch(backupProvider).availableAlbums;
    final selectedBackupAlbums = ref.watch(backupProvider).selectedBackupAlbums;

    useEffect(() {
      ref.read(backupProvider.notifier).getAlbumsOnDevice();
      return null;
    }, []);

    _buildAlbumSelectionList() {
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

    _buildAlbumNameChip() {
      return selectedBackupAlbums.map((a) {
        return Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: Chip(
            visualDensity: VisualDensity.compact,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
            label: Text(
              a.name,
              style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
            ),
            backgroundColor: Theme.of(context).primaryColor,
          ),
        );
      }).toList();
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
              children: [..._buildAlbumNameChip()],
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
            child: Card(
              margin: const EdgeInsets.all(0),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12), // if you need this
                side: const BorderSide(
                  color: Color(0xFFC9C9C9),
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
                      "Selected albums",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[700]),
                    ),
                    trailing: Text(
                      selectedBackupAlbums.length.toString(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  ListTile(
                    visualDensity: VisualDensity.compact,
                    title: Text(
                      "Total unique assets",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[700]),
                    ),
                    trailing: const Text(
                      "3000",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Divider(),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
            child: Text(
              "Albums on device",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8),
            child: Text(
              "Total ${availableAlbums.length.toString()}",
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
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
