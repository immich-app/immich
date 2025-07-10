import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/common/thumbhash.dart';
import 'package:octo_image/octo_image.dart';

/// Simple set to show [OctoPlaceholder.circularProgressIndicator] as
/// placeholder and [OctoError.icon] as error.
OctoSet blurHashOrPlaceholder(String? blurhash, {BoxFit fit = BoxFit.cover, Text? errorMessage}) {
  return OctoSet(
    placeholderBuilder: blurHashPlaceholderBuilder(blurhash, fit: fit),
    errorBuilder: blurHashErrorBuilder(blurhash, fit: fit, message: errorMessage),
  );
}

OctoPlaceholderBuilder blurHashPlaceholderBuilder(String? blurhash, {required BoxFit fit}) {
  return (context) => Thumbhash(blurhash: blurhash, fit: fit);
}

OctoErrorBuilder blurHashErrorBuilder(
  String? blurhash, {
  BoxFit fit = BoxFit.cover,
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
