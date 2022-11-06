import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/home/ui/delete_diaglog.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class ControlBottomAppBar extends ConsumerWidget {
  final Function onShare;
  final Function onDelete;
  final Function(AlbumResponseDto album) onAddToAlbum;
  final void Function() onCreateNewAlbum;

  final List<AlbumResponseDto> albums;

  const ControlBottomAppBar({
    Key? key,
    required this.onShare,
    required this.onDelete,
    required this.albums,
    required this.onAddToAlbum,
    required this.onCreateNewAlbum,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget renderActionButtons() {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            ControlBoxButton(
              iconData: Icons.delete_forever_rounded,
              label: "control_bottom_app_bar_delete".tr(),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return DeleteDialog(
                      onDelete: onDelete,
                    );
                  },
                );
              },
            ),
            ControlBoxButton(
              iconData: Icons.share,
              label: "control_bottom_app_bar_share".tr(),
              onPressed: () {
                onShare();
              },
            ),
          ],
        ),
      );
    }

    Widget renderAlbums() {
      Widget renderAlbum(AlbumResponseDto album) {
        final box = Hive.box(userInfoBox);

        return GestureDetector(
          onTap: () => onAddToAlbum(album),
          child: Container(
            width: 112,
            padding: const EdgeInsets.all(6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                    imageUrl:
                        getAlbumThumbnailUrl(album, type: ThumbnailFormat.JPEG),
                    httpHeaders: {
                      "Authorization": "Bearer ${box.get(accessTokenKey)}"
                    },
                    cacheKey: "${album.albumThumbnailAssetId}",
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    album.albumName,
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Text(album.shared
                        ? "control_bottom_app_bar_album_info_shared"
                        : "control_bottom_app_bar_album_info")
                    .tr(args: [album.assetCount.toString()]),
              ],
            ),
          ),
        );
      }

      return SizedBox(
        height: 200,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemBuilder: (buildContext, i) => renderAlbum(albums[i]),
          itemCount: albums.length,
        ),
      );
    }

    return Positioned(
      bottom: 0,
      left: 0,
      child: Container(
        width: MediaQuery.of(context).size.width,
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(10),
            topRight: Radius.circular(10),
          ),
          color: Theme.of(context).scaffoldBackgroundColor,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            renderActionButtons(),
            const Divider(
              thickness: 2,
            ),
            Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "control_bottom_app_bar_add_to_album",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ).tr(),
                    TextButton(
                      onPressed: onCreateNewAlbum,
                      child: Text(
                        "control_bottom_app_bar_create_new_album",
                        style: TextStyle(
                          color: Theme.of(context).primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ).tr(),
                    ),
                  ],
                )),
            renderAlbums(),
          ],
        ),
      ),
    );
  }
}

class ControlBoxButton extends StatelessWidget {
  const ControlBoxButton({
    Key? key,
    required this.label,
    required this.iconData,
    required this.onPressed,
  }) : super(key: key);

  final String label;
  final IconData iconData;
  final Function onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 60,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          IconButton(
            onPressed: () {
              onPressed();
            },
            icon: Icon(iconData, size: 30),
          ),
          Text(label)
        ],
      ),
    );
  }
}
