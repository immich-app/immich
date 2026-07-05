import 'package:flutter/material.dart';

enum AspectRatioPreset {
  free(ratio: null, label: 'Free', icon: Icons.crop_free_rounded),
  square(ratio: 1.0, label: '1:1', icon: Icons.crop_square_rounded),
  ratio16x9(ratio: 16 / 9, label: '16:9', icon: Icons.crop_16_9_rounded),
  ratio3x2(ratio: 3 / 2, label: '3:2', icon: Icons.crop_3_2_rounded),
  ratio7x5(ratio: 7 / 5, label: '7:5', icon: Icons.crop_7_5_rounded),
  ratio9x16(ratio: 9 / 16, label: '9:16', icon: Icons.crop_16_9_rounded, iconRotated: true),
  ratio2x3(ratio: 2 / 3, label: '2:3', icon: Icons.crop_3_2_rounded, iconRotated: true),
  ratio5x7(ratio: 5 / 7, label: '5:7', icon: Icons.crop_7_5_rounded, iconRotated: true);

  final double? ratio;
  final String label;
  final IconData icon;
  final bool iconRotated;

  const AspectRatioPreset({required this.ratio, required this.label, required this.icon, this.iconRotated = false});
}
