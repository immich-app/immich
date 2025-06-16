import 'package:flutter/material.dart';

class FadeOnTap extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressedOpacity;
  final Duration duration;

  const FadeOnTap({
    super.key,
    required this.child,
    this.onTap,
    this.pressedOpacity = 0.6,
    this.duration = const Duration(milliseconds: 150),
  });

  @override
  Widget build(BuildContext context) {
    return _FadeWrapper(
      onTap: onTap,
      pressedOpacity: pressedOpacity,
      duration: duration,
      child: child,
    );
  }
}

class _FadeWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressedOpacity;
  final Duration duration;

  const _FadeWrapper({
    required this.child,
    required this.onTap,
    required this.pressedOpacity,
    required this.duration,
  });

  @override
  State<_FadeWrapper> createState() => _FadeWrapperState();
}

class _FadeWrapperState extends State<_FadeWrapper> {
  double _opacity = 1.0;

  void _onTapDown(TapDownDetails _) {
    setState(() => _opacity = widget.pressedOpacity.clamp(0.0, 1.0));
  }

  void _onTapUp(TapUpDetails _) {
    setState(() => _opacity = 1.0);
    if (widget.onTap != null) {
      widget.onTap!();
    }
  }

  void _onTapCancel() {
    setState(() => _opacity = 1.0);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedOpacity(
        duration: widget.duration,
        opacity: _opacity,
        curve: Curves.easeInOut,
        child: widget.child,
      ),
    );
  }
}
