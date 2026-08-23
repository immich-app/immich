import 'dart:ui'; // Import the dart:ui library for Rect

import 'package:crop_image/crop_image.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

/// A hook that provides a [CropController] instance.
CropController useCropController() {
  return useMemoized(() => CropController(defaultCrop: const Rect.fromLTRB(0, 0, 1, 1)));
}
