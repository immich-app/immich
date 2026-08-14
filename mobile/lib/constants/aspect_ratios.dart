import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'aspect_ratios.freezed.dart';

@freezed
abstract class CropAspectRatio with _$CropAspectRatio {
  const CropAspectRatio._();

  const factory CropAspectRatio({int? numerator, int? denominator, String? customLabel, IconData? icon}) =
      _CropAspectRatio;

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
}

const aspectRatioFree = CropAspectRatio.free;
const aspectRatioOriginal = CropAspectRatio.original;

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
