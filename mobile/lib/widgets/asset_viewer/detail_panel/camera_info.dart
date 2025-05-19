import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class CameraInfo extends StatelessWidget {
  final ExifInfo exifInfo;

  const CameraInfo({
    super.key,
    required this.exifInfo,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;
    return ListTile(
      contentPadding: const EdgeInsets.all(0),
      dense: true,
      leading: Icon(
        Icons.camera,
        color: textColor.withAlpha(200),
      ),
      title: Text(
        "${exifInfo.make} ${exifInfo.model}",
        style: context.textTheme.labelLarge,
      ),
      subtitle: exifInfo.f != null ||
              exifInfo.exposureSeconds != null ||
              exifInfo.mm != null ||
              exifInfo.iso != null
          ? Text(
              "ƒ/${exifInfo.fNumber}   ${exifInfo.exposureTime}   ${exifInfo.focalLength} mm   ISO ${exifInfo.iso ?? ''} ",
              style: context.textTheme.bodySmall,
            )
          : null,
    );
  }
}
