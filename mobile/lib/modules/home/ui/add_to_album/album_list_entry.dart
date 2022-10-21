import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

abstract class AlbumListEntry extends StatelessWidget {
  const AlbumListEntry({super.key, required this.onClick});

  Widget buildImageWidget(BuildContext buildContext);
  String getText();

  final void Function() onClick;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClick,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: buildImageWidget(context)),
            Padding(
              padding: const EdgeInsets.only(
                left: 10,
              ),
              child: Text(
                getText(),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

class AlbumListAlbumEntry extends AlbumListEntry {
  const AlbumListAlbumEntry(this.album, {super.key, required super.onClick});

  final AlbumResponseDto album;

  @override
  Widget buildImageWidget(BuildContext buildContext) {
    final box = Hive.box(userInfoBox);

    return CachedNetworkImage(
      width: 60,
      height: 60,
      fit: BoxFit.cover,
      httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
      imageUrl: getAlbumThumbnailUrl(album),
    );
  }

  @override
  String getText() {
    return album.albumName;
  }
}

class AlbumListAddEntry extends AlbumListEntry {
  const AlbumListAddEntry({super.key, required super.onClick});

  @override
  Widget buildImageWidget(BuildContext buildContext) {
    return SizedBox(
      width: 60,
      height: 60,
      child: Icon(
        Icons.add_circle_outline,
        color: Theme.of(buildContext).primaryColor,
      ),
    );
  }

  @override
  String getText() {
    return "album_list_entry_add_new_album".tr();
  }
}
