import 'package:flutter/widgets.dart';

class InvertionFilter extends StatelessWidget {
  final Widget? child;
  const InvertionFilter({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return ColorFiltered(
      colorFilter: const ColorFilter.matrix(<double>[
        -1, 0, 0, 0, 255, //
        0, -1, 0, 0, 255, //
        0, 0, -1, 0, 255, //
        0, 0, 0, 1, 0, //
      ]),
      child: child,
    );
  }
}

// -1 - darkest, 1 - brightest, 0 - unchanged
class BrightnessFilter extends StatelessWidget {
  final Widget? child;
  final double brightness;
  const BrightnessFilter({super.key, this.child, this.brightness = 0});

  @override
  Widget build(BuildContext context) {
    return ColorFiltered(
      colorFilter: ColorFilter.matrix(
        _ColorFilterGenerator.brightnessAdjustMatrix(brightness),
      ),
      child: child,
    );
  }
}

// -1 - greyscale, 1 - most saturated, 0 - unchanged
class SaturationFilter extends StatelessWidget {
  final Widget? child;
  final double saturation;
  const SaturationFilter({super.key, this.child, this.saturation = 0});

  @override
  Widget build(BuildContext context) {
    return ColorFiltered(
      colorFilter: ColorFilter.matrix(
        _ColorFilterGenerator.saturationAdjustMatrix(saturation),
      ),
      child: child,
    );
  }
}

class _ColorFilterGenerator {
  static List<double> brightnessAdjustMatrix(double value) {
    value = value * 10;

    if (value == 0) {
      return [
        1, 0, 0, 0, 0, //
        0, 1, 0, 0, 0, //
        0, 0, 1, 0, 0, //
        0, 0, 0, 1, 0, //
      ];
    }

    return List<double>.from(<double>[
      1, 0, 0, 0, value, 0, 1, 0, 0, value, 0, 0, 1, 0, value, 0, 0, 0, 1, 0, //
    ]).map((i) => i.toDouble()).toList();
  }

  static List<double> saturationAdjustMatrix(double value) {
    value = value * 100;

    if (value == 0) {
      return [
        1, 0, 0, 0, 0, //
        0, 1, 0, 0, 0, //
        0, 0, 1, 0, 0, //
        0, 0, 0, 1, 0, //
      ];
    }

    double x =
        ((1 + ((value > 0) ? ((3 * value) / 100) : (value / 100)))).toDouble();
    double lumR = 0.3086;
    double lumG = 0.6094;
    double lumB = 0.082;

    return List<double>.from(<double>[
      (lumR * (1 - x)) + x, lumG * (1 - x), lumB * (1 - x), //
      0, 0, //
      lumR * (1 - x), //
      (lumG * (1 - x)) + x, //
      lumB * (1 - x), //
      0, 0, //
      lumR * (1 - x), //
      lumG * (1 - x), //
      (lumB * (1 - x)) + x, //
      0, 0, 0, 0, 0, 1, 0, //
    ]).map((i) => i.toDouble()).toList();
  }
}
