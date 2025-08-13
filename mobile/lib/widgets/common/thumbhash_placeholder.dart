import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/widgets/common/fade_in_placeholder_image.dart';
import 'package:octo_image/octo_image.dart';

/// Simple set to show [OctoPlaceholder.circularProgressIndicator] as
/// placeholder and [OctoError.icon] as error.
OctoSet blurHashOrPlaceholder(
  Uint8List? blurhash, {
  required double width,
  required double height,
  BoxFit? fit,
  Text? errorMessage,
}) {
  return OctoSet(
    placeholderBuilder: blurHashPlaceholderBuilder(blurhash, width: width, height: height, fit: fit),
    errorBuilder: blurHashErrorBuilder(blurhash, width: width, height: height, fit: fit, message: errorMessage),
  );
}

OctoPlaceholderBuilder blurHashPlaceholderBuilder(
  Uint8List? blurhash, {
  required double width,
  required double height,
  BoxFit? fit,
}) {
  return (context) => blurhash == null
      ? const ThumbnailPlaceholder()
      : FadeInPlaceholderImage(
          placeholder: const ThumbnailPlaceholder(),
          image: MemoryImage(blurhash),
          fit: fit ?? BoxFit.cover,
          width: width,
          height: height,
        );
}

OctoErrorBuilder blurHashErrorBuilder(
  Uint8List? blurhash, {
  required double width,
  required double height,
  BoxFit? fit,
  Text? message,
  IconData? icon,
  Color? iconColor,
  double? iconSize,
}) {
  return OctoError.placeholderWithErrorIcon(
    blurHashPlaceholderBuilder(blurhash, width: width, height: width, fit: fit),
    message: message,
    icon: icon,
    iconColor: iconColor,
    iconSize: iconSize,
  );
}
