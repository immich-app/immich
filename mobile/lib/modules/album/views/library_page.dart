import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:transparent_image/transparent_image.dart';

class LibraryPage extends HookConsumerWidget {
  const LibraryPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);
    var box = Hive.box(userInfoBox);

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    Widget _buildAppBar() {
      return SliverAppBar(
        centerTitle: true,
        floating: false,
        pinned: true,
        snap: false,
        automaticallyImplyLeading: false,
        title: Text(
          'IMMICH',
          style: TextStyle(
            fontFamily: 'SnowburstOne',
            fontWeight: FontWeight.bold,
            fontSize: 22,
            color: Theme.of(context).primaryColor,
          ),
        ),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(12.0),
              child: Text(
                "Albums",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.only(left: 12.0, right: 12, bottom: 50),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 24,
              ),
              delegate: SliverChildBuilderDelegate(
                (BuildContext context, int index) {
                  var albumThumbnailUrl =
                      '${box.get(serverEndpointKey)}/asset/thumbnail/${albums[index].albumThumbnailAssetId}?format=JPEG';

                  return Wrap(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: FadeInImage(
                          width: MediaQuery.of(context).size.width,
                          height: 150,
                          fit: BoxFit.cover,
                          placeholder: MemoryImage(kTransparentImage),
                          image: NetworkImage(
                            albumThumbnailUrl,
                            headers: {
                              "Authorization":
                                  "Bearer ${box.get(accessTokenKey)}"
                            },
                          ),
                          fadeInDuration: const Duration(milliseconds: 200),
                          fadeOutDuration: const Duration(milliseconds: 200),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(
                          albums[index].albumName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      Row(
                        children: [
                          Text(
                            albums[index].assets.length.toString(),
                            style: const TextStyle(
                              fontSize: 12.0,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      )
                    ],
                  );
                },
                childCount: albums.length,
              ),
            ),
          )
        ],
      ),
    );
  }
}


// Column(
//         children: [
//           const Padding(
//             padding: EdgeInsets.all(12.0),
//             child: Align(
//               alignment: Alignment.centerLeft,
//               child: Text(
//                 "Albums",
//                 style: TextStyle(fontWeight: FontWeight.bold),
//               ),
//             ),
//           ),
//           Expanded(
//             child: Padding(
//               padding: const EdgeInsets.symmetric(horizontal: 12.0),
//               child: GridView.builder(
//                 physics: const ClampingScrollPhysics(),
//                 itemCount: albums.length,
//                 shrinkWrap: true,
//                 itemBuilder: (BuildContext context, int index) {
//                   var albumThumbnailUrl = albums[index].albumThumbnailAssetId !=
//                           null
//                       ? '${box.get(serverEndpointKey)}/asset/thumbnail/${albums[index].albumThumbnailAssetId}'
//                       : 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Ymxhbmt8ZW58MHx8MHx8&auto=format&fit=crop&w=700&q=60';

//                   return Padding(
//                     padding: const EdgeInsets.only(
//                       bottom: 12.0,
//                     ),
//                     child: ClipRRect(
//                       borderRadius: BorderRadius.circular(8),
//                       child: FadeInImage(
//                         width: 60,
//                         height: 60,
//                         fit: BoxFit.cover,
//                         placeholder: MemoryImage(kTransparentImage),
//                         image: NetworkImage(
//                           albumThumbnailUrl,
//                           headers: {
//                             "Authorization": "Bearer ${box.get(accessTokenKey)}"
//                           },
//                         ),
//                         fadeInDuration: const Duration(milliseconds: 200),
//                         fadeOutDuration: const Duration(milliseconds: 200),
//                       ),
//                     ),
//                   );
//                 },
//                 gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
//                   crossAxisCount: 2,
//                   crossAxisSpacing: 12,
//                 ),
//               ),
//             ),
//           ),
//         ],
//       ),