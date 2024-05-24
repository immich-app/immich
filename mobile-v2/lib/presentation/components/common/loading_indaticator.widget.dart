import 'package:flutter/material.dart';

class ImLoadingIndicator extends StatelessWidget {
  const ImLoadingIndicator({super.key, this.dimension, this.strokeWidth});

  /// The size of the indicator with a default of 24
  final double? dimension;

  /// The width of the indicator with a default of 2
  final double? strokeWidth;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: dimension ?? 24,
      height: dimension ?? 24,
      child: FittedBox(
        child: CircularProgressIndicator(strokeWidth: strokeWidth ?? 2),
      ),
    );
  }
}
