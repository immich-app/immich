import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

class FileInfo extends StatelessWidget {
  final Asset asset;

  const FileInfo({super.key, required this.asset});

  @override
  Widget build(BuildContext context) {
    final height = asset.orientatedHeight ?? asset.height;
    final width = asset.orientatedWidth ?? asset.width;
    String resolution = height != null && width != null ? "$width x $height  " : "";
    String fileSize = asset.exifInfo?.fileSize != null ? formatBytes(asset.exifInfo!.fileSize!) : "";
    String text = resolution + fileSize;
    final imgSizeString = text.isNotEmpty ? text : null;

    String? title;
    String? subtitle;

    if (imgSizeString == null && asset.fileName.isNotEmpty) {
      title = asset.fileName;
    } else if (imgSizeString != null && asset.fileName.isNotEmpty) {
      title = asset.fileName;
      subtitle = imgSizeString;
    } else if (imgSizeString != null && asset.fileName.isEmpty) {
      title = imgSizeString;
    }

    final videoDetails = _buildVideoDetails(asset.exifInfo);
    final path = asset.originalPath;

    return Column(
      children: [
        if (title != null) _buildRow(context, asset.isVideo ? Icons.videocam : Icons.image, title, subtitle),
        if (videoDetails != null && videoDetails.isNotEmpty)
          _buildRow(context, Icons.info_outline, "video_info_row_title".tr(), videoDetails),
        if (path != null && path.isNotEmpty)
          _buildRow(context, Icons.folder_open, "file_info_path_row_title".tr(), path),
      ],
    );
  }

  Widget _buildRow(BuildContext context, IconData icon, String title, String? subtitle) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;
    return ListTile(
      contentPadding: const EdgeInsets.all(0),
      dense: true,
      leading: Icon(icon, color: textColor.withAlpha(200)),
      titleAlignment: ListTileTitleAlignment.center,
      title: Text(title, style: context.textTheme.labelLarge),
      subtitle: subtitle == null ? null : Text(subtitle),
    );
  }

  String? _buildVideoDetails(ExifInfo? exif) {
    if (exif == null) return null;
    final List<String> details = [];
    if (exif.codec != null) details.add(exif.codec!);
    if (exif.fps != null) details.add("${exif.fps!.toStringAsFixed(0)} FPS");
    if (exif.bitRate != null) {
      details.add("${(exif.bitRate! / 1000).toStringAsFixed(0)} kbps");
    }
    return details.isEmpty ? null : details.join(" • ");
  }
}
