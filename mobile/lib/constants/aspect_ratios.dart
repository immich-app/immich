import 'package:flutter/material.dart';

class CropAspectRatio {
  final int? numerator;
  final int? denominator;

  final String? customLabel;
  final IconData? icon;

  const CropAspectRatio({this.numerator, this.denominator, this.customLabel, this.icon});

  static const free = CropAspectRatio(customLabel: "Free", icon: Icons.crop_free);
  static const original = CropAspectRatio(customLabel: "Original", icon: Icons.crop_original);

  String get label {
    return customLabel ?? (numerator != null && denominator != null ? '$numerator:$denominator' : 'Free');
  }

  bool get hasFlippedVariant => numerator != denominator;
  double? get ratio => (numerator != null && denominator != null) ? numerator! / denominator! : null;

  CropAspectRatio get flipped {
    return CropAspectRatio(numerator: denominator, denominator: numerator, customLabel: customLabel, icon: icon);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is CropAspectRatio &&
        other.numerator == numerator &&
        other.denominator == denominator &&
        other.customLabel == customLabel &&
        other.icon == icon;
  }

  @override
  int get hashCode {
    return numerator.hashCode ^ denominator.hashCode ^ customLabel.hashCode ^ icon.hashCode;
  }
}

const aspectRatioFree = CropAspectRatio(customLabel: "Free", icon: Icons.crop_free);
const aspectRatioOriginal = CropAspectRatio(customLabel: "Original", icon: Icons.crop_original);

final aspectRatioPresets = [
  CropAspectRatio.free,
  CropAspectRatio.original,

  const CropAspectRatio(numerator: 1, denominator: 1),

  // lanscape
  const CropAspectRatio(numerator: 16, denominator: 9),
  const CropAspectRatio(numerator: 3, denominator: 2),
  const CropAspectRatio(numerator: 7, denominator: 5),
  const CropAspectRatio(numerator: 4, denominator: 3),

  // portrait
  const CropAspectRatio(numerator: 16, denominator: 9).flipped,
  const CropAspectRatio(numerator: 3, denominator: 2).flipped,
  const CropAspectRatio(numerator: 7, denominator: 5).flipped,
  const CropAspectRatio(numerator: 4, denominator: 3).flipped,
];
