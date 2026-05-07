import 'dart:ui';

import 'package:flutter/material.dart';

/// A widget that animates implicitly between a play and a pause icon.
class AnimatedPlayPause extends StatefulWidget {
  const AnimatedPlayPause({super.key, required this.playing, this.size, this.color, this.shadows});

  final double? size;
  final bool playing;
  final Color? color;
  final List<Shadow>? shadows;

  @override
  State<StatefulWidget> createState() => AnimatedPlayPauseState();
}

class AnimatedPlayPauseState extends State<AnimatedPlayPause> with SingleTickerProviderStateMixin {
  late final animationController = AnimationController(
    vsync: this,
    value: widget.playing ? 1 : 0,
    duration: const Duration(milliseconds: 300),
  );

  @override
  void didUpdateWidget(AnimatedPlayPause oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.playing != oldWidget.playing) {
      if (widget.playing) {
        animationController.forward();
      } else {
        animationController.reverse();
      }
    }
  }

  @override
  void dispose() {
    animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final icon = AnimatedIcon(
      color: widget.color,
      size: widget.size,
      icon: AnimatedIcons.play_pause,
      progress: animationController,
    );

    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          for (final shadow in widget.shadows ?? const <Shadow>[])
            Transform.translate(
              offset: shadow.offset,
              child: ImageFiltered(
                imageFilter: ImageFilter.blur(sigmaX: shadow.blurRadius / 2, sigmaY: shadow.blurRadius / 2),
                child: AnimatedIcon(
                  color: shadow.color,
                  size: widget.size,
                  icon: AnimatedIcons.play_pause,
                  progress: animationController,
                ),
              ),
            ),
          icon,
        ],
      ),
    );
  }
}
