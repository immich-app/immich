import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/widgets/common/fade_in_placeholder_image.dart';
import 'package:octo_image/octo_image.dart';

OctoPlaceholderBuilder blurHashPlaceholderBuilder(Uint8List? blurhash, {BoxFit? fit}) {
  return (context) => blurhash == null
      ? const ThumbnailPlaceholder()
      : FadeInPlaceholderImage(
          placeholder: const ThumbnailPlaceholder(),
          image: MemoryImage(blurhash),
          fit: fit ?? BoxFit.cover,
        );
}

OctoErrorBuilder blurHashErrorBuilder(
  Uint8List? blurhash, {
  BoxFit? fit,
  Text? message,
  IconData? icon,
  Color? iconColor,
  double? iconSize,
}) {
  return OctoError.placeholderWithErrorIcon(
    blurHashPlaceholderBuilder(blurhash, fit: fit),
    message: message,
    icon: icon,
    iconColor: iconColor,
    iconSize: iconSize,
  );
}
