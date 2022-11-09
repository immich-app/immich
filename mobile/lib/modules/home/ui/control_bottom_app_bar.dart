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
      return Row(
        children: [
          ControlBoxButton(
            iconData: Icons.ios_share_rounded,
            label: "control_bottom_app_bar_share".tr(),
            onPressed: () {
              onShare();
            },
          ),
          ControlBoxButton(
            iconData: Icons.delete_outline_rounded,
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
        ],
      );
    }

    Widget renderAlbums() {
      Widget renderAlbum(AlbumResponseDto album) {
        final box = Hive.box(userInfoBox);

        return Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: GestureDetector(
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
                      imageUrl: getAlbumThumbnailUrl(
                        album,
                        type: ThumbnailFormat.JPEG,
                      ),
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
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12.0,
                      ),
                    ),
                  ),
                ],
              ),
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

    return DraggableScrollableSheet(
      initialChildSize: 0.30,
      minChildSize: 0.15,
      maxChildSize: 0.57,
      snap: true,
      builder: (
        BuildContext context,
        ScrollController scrollController,
      ) {
        return SingleChildScrollView(
          controller: scrollController,
          child: Card(
            elevation: 12.0,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            margin: const EdgeInsets.all(0),
            child: Container(
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
              ),
              child: Column(
                children: <Widget>[
                  const SizedBox(height: 12),
                  const CustomDraggingHandle(),
                  const SizedBox(height: 12),
                  renderActionButtons(),
                  const Divider(
                    indent: 16,
                    endIndent: 16,
                    thickness: 1,
                  ),
                  AddToAlbumTitleRow(
                    onCreateNewAlbum: () => onCreateNewAlbum(),
                  ),
                  renderAlbums(),
                  const SizedBox(height: 200),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class AddToAlbumTitleRow extends StatelessWidget {
  const AddToAlbumTitleRow({
    super.key,
    required this.onCreateNewAlbum,
  });

  final VoidCallback onCreateNewAlbum;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            "control_bottom_app_bar_add_to_album",
            style: TextStyle(
              fontSize: 14,
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
                fontSize: 14,
              ),
            ).tr(),
          ),
        ],
      ),
    );
  }
}

class CustomDraggingHandle extends StatelessWidget {
  const CustomDraggingHandle({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 5,
      width: 30,
      decoration: BoxDecoration(
        color: Colors.grey[500],
        borderRadius: BorderRadius.circular(16),
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
    return MaterialButton(
      padding: const EdgeInsets.all(10),
      shape: const CircleBorder(),
      onPressed: () => onPressed(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(iconData, size: 24),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 12.0),
          ),
        ],
      ),
    );
  }
}
