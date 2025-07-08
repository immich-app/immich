import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/widgets/common/thumbhash.dart';
import 'package:octo_image/octo_image.dart';

/// Simple set to show [OctoPlaceholder.circularProgressIndicator] as
/// placeholder and [OctoError.icon] as error.
OctoSet blurHashOrPlaceholder(String? blurhash, {BoxFit? fit, Text? errorMessage}) {
  return OctoSet(
    placeholderBuilder: blurHashPlaceholderBuilder(blurhash, fit: fit),
    errorBuilder: blurHashErrorBuilder(blurhash, fit: fit, message: errorMessage),
  );
}

OctoPlaceholderBuilder blurHashPlaceholderBuilder(String? blurhash, {BoxFit? fit}) {
  return (context) => blurhash == null
      ? const ThumbnailPlaceholder()
      : Thumbhash(
          blurhash: blurhash,
          fit: fit ?? BoxFit.cover,
        );
}

OctoErrorBuilder blurHashErrorBuilder(
  String? blurhash, {
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
