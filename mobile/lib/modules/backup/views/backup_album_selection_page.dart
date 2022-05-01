import 'dart:typed_data';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final availableAlbums = ref.watch(backupProvider).availableAlbums;

    useEffect(() {
      ref.read(backupProvider.notifier).getAlbumsOnDevice();
      return null;
    }, []);

    _buildImageThumbnail(Uint8List? imageData, AssetPathEntity albumInfo) {
      if (imageData != null) {
        return Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(5), // if you need this
            side: const BorderSide(
              color: Colors.black12,
              width: 1,
            ),
          ),
          elevation: 0,
          borderOnForeground: false,
          child: Column(
            children: [
              Row(
                children: [
                  Image.memory(
                    imageData,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                  ),
                  Column(
                    children: [Text(albumInfo.name), Text(albumInfo.assetCount.toString())],
                  )
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: <Widget>[
                  TextButton(
                    child: const Text('BUY TICKETS'),
                    onPressed: () {/* ... */},
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    child: const Text('LISTEN'),
                    onPressed: () {/* ... */},
                  ),
                  const SizedBox(width: 8),
                ],
              ),
            ],
          ),
        );
      }

      return Image.asset(
        'assets/immich-logo-no-outline.png',
        width: 512,
        height: 512,
        fit: BoxFit.cover,
      );
    }

    _buildAlbumSelectionList() {
      return ListView.builder(
        // gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        //   crossAxisCount: 2,
        //   crossAxisSpacing: 10,
        //   mainAxisSpacing: 10,
        // ),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: availableAlbums.length,
        itemBuilder: ((context, index) {
          var thumbnailData = availableAlbums[index].thumbnailData;

          return _buildImageThumbnail(thumbnailData, availableAlbums[index].albumEntity);
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
        shrinkWrap: true,
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
