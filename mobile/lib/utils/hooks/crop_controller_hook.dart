import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:crop_image/crop_image.dart';
import 'dart:ui'; // Import the dart:ui library for Rect

/// A hook that provides a [CropController] instance.
CropController useCropController() {
  return useMemoized(
    () => CropController(
      defaultCrop: const Rect.fromLTRB(0, 0, 1, 1),
    ),
  );
}
