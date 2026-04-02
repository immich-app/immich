import 'package:flutter/material.dart';

class AspectRatioPreset {
  final double? ratio;
  final String label;
  final IconData icon;
  final bool iconRotated;

  const AspectRatioPreset({required this.ratio, required this.label, required this.icon, this.iconRotated = false});

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is AspectRatioPreset) {
      return ratio == other.ratio && label == other.label;
    }
    return false;
  }

  @override
  int get hashCode => ratio.hashCode ^ label.hashCode;
}

const aspectRatios = [
  AspectRatioPreset(ratio: null, label: 'Free', icon: Icons.crop_free_rounded),
  AspectRatioPreset(ratio: 1.0, label: '1:1', icon: Icons.crop_square_rounded),
  AspectRatioPreset(ratio: 16 / 9, label: '16:9', icon: Icons.crop_16_9_rounded),
  AspectRatioPreset(ratio: 3 / 2, label: '3:2', icon: Icons.crop_3_2_rounded),
  AspectRatioPreset(ratio: 7 / 5, label: '7:5', icon: Icons.crop_7_5_rounded),
  AspectRatioPreset(ratio: 9 / 16, label: '9:16', icon: Icons.crop_16_9_rounded, iconRotated: true),
  AspectRatioPreset(ratio: 2 / 3, label: '2:3', icon: Icons.crop_3_2_rounded, iconRotated: true),
  AspectRatioPreset(ratio: 5 / 7, label: '5:7', icon: Icons.crop_7_5_rounded, iconRotated: true),
];
