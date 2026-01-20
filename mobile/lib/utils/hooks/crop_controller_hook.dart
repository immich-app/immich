import 'dart:ui'; // Import the dart:ui library for Rect

import 'package:crop_image/crop_image.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

/// A hook that provides a [CropController] instance.
CropController useCropController({Rect? initialCrop, CropRotation? initialRotation}) {
  return useMemoized(
    () => CropController(
      defaultCrop: initialCrop ?? const Rect.fromLTRB(0, 0, 1, 1),
      rotation: initialRotation ?? CropRotation.up,
    ),
  );
}
