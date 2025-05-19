import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

class FileInfo extends StatelessWidget {
  final Asset asset;

  const FileInfo({
    super.key,
    required this.asset,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;

    final height = asset.orientatedHeight ?? asset.height;
    final width = asset.orientatedWidth ?? asset.width;
    String resolution =
        height != null && width != null ? "$width x $height  " : "";
    String fileSize = asset.exifInfo?.fileSize != null
        ? formatBytes(asset.exifInfo!.fileSize!)
        : "";
    String text = resolution + fileSize;
    final imgSizeString = text.isNotEmpty ? text : null;

    String? title;
    String? subtitle;

    if (imgSizeString == null && asset.fileName.isNotEmpty) {
      // There is only filename
      title = asset.fileName;
    } else if (imgSizeString != null && asset.fileName.isNotEmpty) {
      // There is both filename and size information
      title = asset.fileName;
      subtitle = imgSizeString;
    } else if (imgSizeString != null && asset.fileName.isEmpty) {
      title = imgSizeString;
    } else {
      return const SizedBox.shrink();
    }

    return ListTile(
      contentPadding: const EdgeInsets.all(0),
      dense: true,
      leading: Icon(
        Icons.image,
        color: textColor.withAlpha(200),
      ),
      titleAlignment: ListTileTitleAlignment.center,
      title: Text(
        title,
        style: context.textTheme.labelLarge,
      ),
      subtitle: subtitle == null ? null : Text(subtitle),
    );
  }
}
