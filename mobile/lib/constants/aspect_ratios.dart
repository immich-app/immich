import 'package:flutter/material.dart';

enum AspectRatioPreset {
  free(ratio: null, label: 'Free', icon: Icons.crop_free_rounded),
  original(ratio: null, label: 'Original', icon: Icons.crop_original_rounded),
  square(ratio: 1.0, label: '1:1'),

  ratio16x9(ratio: 16 / 9, label: '16:9'),
  ratio3x2(ratio: 3 / 2, label: '3:2'),
  ratio7x5(ratio: 7 / 5, label: '7:5'),
  ratio4x3(ratio: 4 / 3, label: '4:3'),

  ratio9x16(ratio: 9 / 16, label: '9:16'),
  ratio2x3(ratio: 2 / 3, label: '2:3'),
  ratio5x7(ratio: 5 / 7, label: '5:7'),
  ratio3x4(ratio: 3 / 4, label: '3:4');

  final double? ratio;
  final String label;
  final IconData? icon;

  const AspectRatioPreset({required this.ratio, required this.label, this.icon});

  AspectRatioPreset get flipped {
    switch (this) {
      case AspectRatioPreset.ratio16x9:
        return AspectRatioPreset.ratio9x16;
      case AspectRatioPreset.ratio3x2:
        return AspectRatioPreset.ratio2x3;
      case AspectRatioPreset.ratio7x5:
        return AspectRatioPreset.ratio5x7;
      case AspectRatioPreset.ratio4x3:
        return AspectRatioPreset.ratio3x4;
      case AspectRatioPreset.ratio9x16:
        return AspectRatioPreset.ratio16x9;
      case AspectRatioPreset.ratio2x3:
        return AspectRatioPreset.ratio3x2;
      case AspectRatioPreset.ratio5x7:
        return AspectRatioPreset.ratio7x5;
      case AspectRatioPreset.ratio3x4:
        return AspectRatioPreset.ratio4x3;
      default:
        return this;
    }
  }
}
