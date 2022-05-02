import 'dart:typed_data';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:photo_manager/photo_manager.dart';

class AlbumInfoCard extends HookConsumerWidget {
  final Uint8List? imageData;
  final AssetPathEntity albumInfo;

  const AlbumInfoCard({Key? key, this.imageData, required this.albumInfo}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ColorFilter selectedFilter = ColorFilter.mode(Colors.grey.withAlpha(200), BlendMode.darken);
    ColorFilter unselectedFilter = const ColorFilter.mode(Colors.black, BlendMode.color);

    _buildSelectedTextBox() {
      return Chip(
        visualDensity: VisualDensity.compact,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
        label: const Text(
          "SELECTED",
          style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Theme.of(context).primaryColor,
      );
    }

    return GestureDetector(
      onTap: () {
        HapticFeedback.heavyImpact();
      },
      child: Card(
        margin: const EdgeInsets.all(1),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
                    image: DecorationImage(
                      colorFilter: selectedFilter,
                      image: imageData != null
                          ? MemoryImage(imageData!)
                          : const AssetImage('assets/immich-logo-no-outline.png') as ImageProvider,
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: null,
                ),
                Positioned(bottom: 10, left: 25, child: _buildSelectedTextBox())
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 140,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 25.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            albumInfo.name,
                            style: TextStyle(
                                fontSize: 14, color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 2.0),
                            child: Text(
                              albumInfo.assetCount.toString() + (albumInfo.isAll ? " (ALL)" : ""),
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      AutoRouter.of(context).push(AlbumPreviewRoute(album: albumInfo));
                    },
                    icon: Icon(
                      Icons.image_outlined,
                      color: Theme.of(context).primaryColor,
                      size: 24,
                    ),
                    splashRadius: 25,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
