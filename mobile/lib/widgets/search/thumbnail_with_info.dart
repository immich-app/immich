import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info_container.dart';
import 'package:immich_mobile/services/api.service.dart';

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
    var textAndIconColor =
        context.isDarkTheme ? Colors.grey[100] : Colors.grey[700];
    return ThumbnailWithInfoContainer(
      onTap: onTap,
      borderRadius: borderRadius,
      label: textInfo,
      child: imageUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(borderRadius),
              child: CachedNetworkImage(
                width: double.infinity,
                height: double.infinity,
                fit: BoxFit.cover,
                imageUrl: imageUrl!,
                httpHeaders: ApiService.getRequestHeaders(),
                errorWidget: (context, url, error) =>
                    const Icon(Icons.image_not_supported_outlined),
              ),
            )
          : Center(
              child: Icon(
                noImageIcon ?? Icons.not_listed_location,
                color: textAndIconColor,
              ),
            ),
    );
  }
}
