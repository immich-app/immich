import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info_container.dart';

class ThumbnailWithInfo extends StatelessWidget {
  const ThumbnailWithInfo({
    super.key,
    required this.textInfo,
    this.imageUrl,
    this.noImageIcon,
    this.borderRadius = 10,
    this.onTap,
  });

  final String textInfo;
  final String? imageUrl;
  final VoidCallback? onTap;
  final IconData? noImageIcon;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    var textAndIconColor = context.isDarkTheme ? Colors.grey[100] : Colors.grey[700];
    return ThumbnailWithInfoContainer(
      onTap: onTap,
      borderRadius: borderRadius,
      label: textInfo,
      child: imageUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(borderRadius),
              child: Thumbnail(imageProvider: RemoteImageProvider(url: imageUrl!)),
            )
          : Center(child: Icon(noImageIcon ?? Icons.not_listed_location, color: textAndIconColor)),
    );
  }
}
