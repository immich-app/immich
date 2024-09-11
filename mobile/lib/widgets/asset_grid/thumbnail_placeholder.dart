import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class ThumbnailPlaceholder extends StatelessWidget {
  final EdgeInsets margin;
  final double width;
  final double height;

  const ThumbnailPlaceholder({
    super.key,
    this.margin = EdgeInsets.zero,
    this.width = 250,
    this.height = 250,
  });

  @override
  Widget build(BuildContext context) {
    var gradientColors = [
      context.colorScheme.surfaceContainer,
      context.colorScheme.surfaceContainer.darken(amount: .1),
    ];

    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
    );
  }
}
