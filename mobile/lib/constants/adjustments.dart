import 'package:flutter/material.dart';

class AdjustValues {
  final double brightness;
  final double contrast;
  final double saturation;
  final double warmth;
  final double sharpness;

  const AdjustValues({
    this.brightness = 0,
    this.contrast = 0,
    this.saturation = 0,
    this.warmth = 0,
    this.sharpness = 0,
  });

  bool get hasChanges => brightness != 0 || contrast != 0 || saturation != 0 || warmth != 0 || sharpness != 0;
}

class AdjustPreset {
  /// The i18n key for the preset label (e.g. 'adjust_preset_vivid').
  final String labelKey;
  final AdjustValues values;

  const AdjustPreset({required this.labelKey, required this.values});
}

const List<AdjustPreset> adjustPresets = [
  AdjustPreset(labelKey: 'adjust_preset_original', values: AdjustValues()),
  AdjustPreset(
    labelKey: 'adjust_preset_vivid',
    values: AdjustValues(brightness: 5, contrast: 15, saturation: 40, sharpness: 10),
  ),
  AdjustPreset(
    labelKey: 'adjust_preset_dramatic',
    values: AdjustValues(brightness: -10, contrast: 40, saturation: -10, sharpness: 20),
  ),
  AdjustPreset(
    labelKey: 'adjust_preset_noir',
    values: AdjustValues(brightness: -5, contrast: 30, saturation: -100, sharpness: 15),
  ),
  AdjustPreset(labelKey: 'adjust_preset_mono', values: AdjustValues(contrast: 10, saturation: -100)),
  AdjustPreset(
    labelKey: 'adjust_preset_sepia',
    values: AdjustValues(brightness: 5, contrast: 5, saturation: -50, warmth: 40),
  ),
  AdjustPreset(
    labelKey: 'adjust_preset_warm',
    values: AdjustValues(brightness: 5, contrast: 5, saturation: 10, warmth: 30),
  ),
  AdjustPreset(labelKey: 'adjust_preset_cool', values: AdjustValues(contrast: 5, saturation: 5, warmth: -30)),
  AdjustPreset(
    labelKey: 'adjust_preset_vintage',
    values: AdjustValues(brightness: -5, contrast: -10, saturation: -30, warmth: 20),
  ),
  AdjustPreset(labelKey: 'adjust_preset_fade', values: AdjustValues(brightness: 10, contrast: -20, saturation: -20)),
];

const AdjustValues autoEnhanceValues = AdjustValues(
  brightness: 5,
  contrast: 15,
  saturation: 20,
  warmth: 5,
  sharpness: 10,
);

/// BT.709 luminance coefficients for perceptual grayscale.
const double _lumR = 0.2126;
const double _lumG = 0.7152;
const double _lumB = 0.0722;

/// Builds a 4x5 (20-element) color matrix from adjustment slider values.
/// Each slider ranges from -100 to +100.
///
/// Sharpness is approximated as a local-contrast boost (high-frequency emphasis)
/// by scaling RGB away from mid-gray. True spatial sharpening requires a
/// convolution kernel; this gives a perceptual preview within ColorFilter limits.
ColorFilter adjustValuesToColorFilter(AdjustValues v) {
  var m = _identity();
  if (v.brightness != 0) m = _multiply(m, _brightnessMatrix(v.brightness));
  if (v.contrast != 0) m = _multiply(m, _contrastMatrix(v.contrast));
  if (v.saturation != 0) m = _multiply(m, _saturationMatrix(v.saturation));
  if (v.warmth != 0) m = _multiply(m, _warmthMatrix(v.warmth));
  if (v.sharpness != 0) m = _multiply(m, _sharpnessMatrix(v.sharpness));
  return ColorFilter.matrix(m);
}

List<double> _identity() {
  return <double>[
    1, 0, 0, 0, 0, //
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/// Brightness: translate RGB channels. slider -100..+100 → offset -50..+50.
List<double> _brightnessMatrix(double slider) {
  final offset = slider / 100 * 50;
  return <double>[
    1, 0, 0, 0, offset, //
    0, 1, 0, 0, offset,
    0, 0, 1, 0, offset,
    0, 0, 0, 1, 0,
  ];
}

/// Contrast: scale around mid-gray (128). slider -100..+100 → factor 0.5..1.5.
List<double> _contrastMatrix(double slider) {
  final f = 1.0 + slider / 100 * 0.5;
  final t = 128 * (1 - f);
  return <double>[
    f, 0, 0, 0, t, //
    0, f, 0, 0, t,
    0, 0, f, 0, t,
    0, 0, 0, 1, 0,
  ];
}

/// Saturation: blend between luminance (grayscale) and identity.
/// slider -100..+100 → factor 0..2.
List<double> _saturationMatrix(double slider) {
  final s = 1.0 + slider / 100;
  final sr = (1 - s) * _lumR;
  final sg = (1 - s) * _lumG;
  final sb = (1 - s) * _lumB;
  return <double>[
    sr + s, sg, sb, 0, 0, //
    sr, sg + s, sb, 0, 0,
    sr, sg, sb + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/// Warmth: shift red/blue offsets. Positive = warm (add red, subtract blue).
List<double> _warmthMatrix(double slider) {
  final shift = slider / 100 * 25;
  return <double>[
    1, 0, 0, 0, shift, //
    0, 1, 0, 0, 0,
    0, 0, 1, 0, -shift,
    0, 0, 0, 1, 0,
  ];
}

/// Sharpness approximation via local-contrast boost.
///
/// True sharpening is a spatial convolution (unsharp mask), which cannot be
/// expressed as a 4x5 color matrix. This approximation increases contrast
/// around mid-tones by scaling RGB and applying a negative offset, giving a
/// perceptual "crispness" effect. slider -100..+100 → factor 1.0..1.3.
List<double> _sharpnessMatrix(double slider) {
  final f = 1.0 + slider / 100 * 0.3;
  final t = 128 * (1 - f);
  return <double>[
    f, 0, 0, 0, t, //
    0, f, 0, 0, t,
    0, 0, f, 0, t,
    0, 0, 0, 1, 0,
  ];
}

/// Multiply two 4x5 matrices (row-major, 4 rows x 5 cols).
List<double> _multiply(List<double> a, List<double> b) {
  final result = List<double>.filled(20, 0);
  for (int row = 0; row < 4; row++) {
    for (int col = 0; col < 5; col++) {
      double sum = 0;
      for (int k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      // Add the translation component
      if (col == 4) {
        sum += a[row * 5 + 4];
      }
      result[row * 5 + col] = sum;
    }
  }
  // Clamp offsets to prevent overflow
  for (int row = 0; row < 4; row++) {
    result[row * 5 + 4] = result[row * 5 + 4].clamp(-255, 255).toDouble();
  }
  return result;
}
