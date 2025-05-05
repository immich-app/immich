import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';

class ImmichLoadingIndicator extends HookWidget {
  final double? borderRadius;

  const ImmichLoadingIndicator({
    super.key,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final logoAnimationController = useAnimationController(
      duration: const Duration(seconds: 6),
    )
      ..reverse()
      ..repeat();

    final borderAnimationController = useAnimationController(
      duration: const Duration(seconds: 6),
    )..repeat();

    return Container(
      height: 80,
      width: 80,
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius ?? 50),
        backgroundBlendMode: BlendMode.luminosity,
      ),
      child: AnimatedBuilder(
        animation: borderAnimationController,
        builder: (context, child) {
          return CustomPaint(
            painter: GradientBorderPainter(
              animation: borderAnimationController.value,
              strokeWidth: 3,
            ),
            child: child,
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: RotationTransition(
            turns: logoAnimationController,
            child: const ImmichLogo(
              heroTag: 'logo',
            ),
          ),
        ),
      ),
    );
  }
}

class GradientBorderPainter extends CustomPainter {
  final double animation;
  final double strokeWidth;
  final double opacity = 0.7;
  final colors = [
    const Color(0xFFFA2921),
    const Color(0xFFED79B5),
    const Color(0xFFFFB400),
    const Color(0xFF1E83F7),
    const Color(0xFF18C249),
  ];

  GradientBorderPainter({
    required this.animation,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) / 2 - strokeWidth / 2;

    // Create a sweep gradient that covers the entire circle
    final Rect rect = Rect.fromCircle(center: center, radius: radius);

    // Create a paint with the gradient
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    // Create a gradient that smoothly transitions between colors
    final shader = SweepGradient(
      // Use a fixed starting point and let matrix transformation handle rotation
      startAngle: 0,
      endAngle: 2 * 3.14159,
      colors: [
        // Repeat colors to ensure smooth transitions
        ...colors.map((c) => c.withValues(alpha: opacity)),
        colors.first.withValues(alpha: opacity),
      ],
      // Add evenly distributed stops
      stops: List.generate(
        colors.length + 1,
        (index) => index / colors.length,
      ),
      tileMode: TileMode.clamp,
      // Use transformations to rotate the gradient
      transform: GradientRotation(-animation * 2 * 3.14159),
    ).createShader(rect);

    paint.shader = shader;

    // Draw the circular border
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(GradientBorderPainter oldDelegate) {
    return animation != oldDelegate.animation;
  }

  double min(double a, double b) => a < b ? a : b;
}
