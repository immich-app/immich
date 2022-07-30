import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';

class LibraryPage extends HookConsumerWidget {
  const LibraryPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: immichBackgroundColor,
        leading: const SizedBox(),
        centerTitle: true,
        title: Text(
          'IMMICH',
          style: TextStyle(
            fontFamily: 'SnowburstOne',
            fontWeight: FontWeight.bold,
            fontSize: 22,
            color: Theme.of(context).primaryColor,
          ),
        ),
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(12.0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Albums",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Expanded(
            child: GridView.builder(
              physics: const ClampingScrollPhysics(),
              itemCount: albums.length,
              shrinkWrap: true,
              itemBuilder: (BuildContext context, int index) {
                return Text(albums[index].albumName);
              },
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
