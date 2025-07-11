import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/common/thumbhash.dart';
import 'package:octo_image/octo_image.dart';

OctoPlaceholderBuilder blurHashPlaceholderBuilder(
  String? blurhash, {
  required BoxFit fit,
}) {
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
