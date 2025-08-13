import 'package:flutter/material.dart';

class FadeInPlaceholderImage extends StatelessWidget {
  final Widget placeholder;
  final ImageProvider image;
  final Duration duration;
  final BoxFit fit;
  final double width;
  final double height;

  const FadeInPlaceholderImage({
    super.key,
    required this.placeholder,
    required this.image,
    required this.width,
    required this.height,
    this.duration = const Duration(milliseconds: 100),
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    final stopwatch = Stopwatch()..start();
    return Image(
      image: image,
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
        if (frame == null) {
          return AnimatedSwitcher(duration: duration, child: placeholder);
        }

        stopwatch.stop();
        if (stopwatch.elapsedMilliseconds < 32) {
          return child;
        }
        return AnimatedSwitcher(duration: duration, child: child);
      },
      filterQuality: FilterQuality.low,
      fit: fit,
      width: width,
      height: height,
    );
  }
}
