import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';

class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final availableAlbums = ref.watch(backupProvider).availableAlbums;

    useEffect(() {
      ref.read(backupProvider.notifier).getAlbumsOnDevice();
      return null;
    }, []);

    _buildAlbumSelectionList() {
      return GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 0,
          mainAxisSpacing: 20,
        ),
        shrinkWrap: true,
        itemCount: availableAlbums.length,
        itemBuilder: ((context, index) {
          var thumbnailData = availableAlbums[index].thumbnailData;

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(5),
                image: DecorationImage(
                  colorFilter: const ColorFilter.mode(Colors.black, BlendMode.difference),
                  opacity: 0.8,
                  image: thumbnailData != null
                      ? MemoryImage(thumbnailData)
                      : const AssetImage('assets/immich-logo-no-outline.png') as ImageProvider,
                  fit: BoxFit.cover,
                ),
              ),
              child: Column(
                children: [
                  const Text("AlbumNAme"),
                  CheckboxListTile(
                    title: Text(
                      availableAlbums[index].albumEntity.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                        "Assets ${availableAlbums[index].albumEntity.assetCount} - ${availableAlbums[index].albumEntity.isAll}"),
                    onChanged: (value) {
                      print("Album ${availableAlbums[index].albumEntity.name}");
                    },
                    value: availableAlbums.contains(availableAlbums[index]),
                  ),
                ],
              ),
            ),
          );
        }),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        title: const Text(
          "Select Albums",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
      ),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
            child: Text(
              "Albums on device",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          _buildAlbumSelectionList(),
        ],
      ),
    );
  }
}
