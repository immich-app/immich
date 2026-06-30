import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/feature_message.model.dart';
import 'package:immich_mobile/presentation/widgets/feature_message/feature_message_placeholder.widget.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

Future<void> showFeatureMessageDialog(BuildContext context) {
  return showGeneralDialog<void>(
    context: context,
    useRootNavigator: true,
    barrierDismissible: true,
    barrierLabel: context.t.whats_new,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    transitionDuration: const Duration(milliseconds: 280),
    pageBuilder: (_, __, ___) => const _FeatureMessageDialog(),
    transitionBuilder: (_, animation, __, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);
      return FadeTransition(
        opacity: animation,
        child: ScaleTransition(scale: Tween<double>(begin: 0.94, end: 1.0).animate(curved), child: child),
      );
    },
  );
}

class _FeatureMessageDialog extends StatefulWidget {
  const _FeatureMessageDialog();

  @override
  State<_FeatureMessageDialog> createState() => _FeatureMessageDialogState();
}

class _FeatureMessageDialogState extends State<_FeatureMessageDialog> with SingleTickerProviderStateMixin {
  static const double _radius = 24;

  final PageController _controller = PageController();
  late final AnimationController _borderController = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 7),
  )..repeat();
  final List<FeatureHighlight> _highlights = visibleFeatureMessageHighlights;
  int _index = 0;

  bool get _isLast => _index >= _highlights.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    _borderController.dispose();
    super.dispose();
  }

  void _advance() {
    if (_isLast) {
      Navigator.of(context).pop();
      return;
    }
    _controller.nextPage(duration: const Duration(milliseconds: 320), curve: Curves.easeOutCubic);
  }

  List<Color> _borderColors(BuildContext context) {
    final scheme = context.colorScheme;
    // Mute the hues toward the surface and drop opacity in dark mode to keep it gentle.
    Color tone(Color c) => context.isDarkTheme ? Color.lerp(c, scheme.surface, 0.45)!.withValues(alpha: 0.6) : c;
    return [tone(scheme.primary), tone(scheme.tertiary), tone(scheme.secondary), tone(scheme.primary)];
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 64),
      clipBehavior: Clip.antiAlias,
      backgroundColor: context.isDarkTheme ? context.colorScheme.surfaceContainerLow : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(_radius))),
      child: AnimatedBuilder(
        animation: _borderController,
        builder: (context, child) => CustomPaint(
          foregroundPainter: _GradientBorderPainter(
            rotation: _borderController.value,
            colors: _borderColors(context),
            radius: _radius,
            strokeWidth: 3,
          ),
          child: child,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: context.height * 0.9, maxWidth: 480),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(context.t.whats_new, style: context.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(
                      context.t.whats_new_version(version: featureMessageRelease.toString()),
                      style: context.textTheme.bodyLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _highlights.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (_, index) => _FeaturePage(highlight: _highlights[index]),
                ),
              ),
              const SizedBox(height: 8),
              _PageDots(controller: _controller, index: _index, count: _highlights.length),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
                child: Row(
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14)),
                      child: Text(context.t.skip),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.all(Radius.circular(100)),
                          boxShadow: [
                            // Soft wide primary glow.
                            BoxShadow(
                              color: context.primaryColor.withValues(alpha: 0.38),
                              blurRadius: 22,
                              spreadRadius: -4,
                              offset: const Offset(0, 10),
                            ),
                            // Tight contact shadow for grounding.
                            BoxShadow(
                              color: context.primaryColor.withValues(alpha: 0.22),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: FilledButton(
                          onPressed: _advance,
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            elevation: 0,
                            textStyle: context.textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 200),
                            child: Text(_isLast ? context.t.ok : context.t.next, key: ValueKey(_isLast)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GradientBorderPainter extends CustomPainter {
  const _GradientBorderPainter({
    required this.rotation,
    required this.colors,
    required this.radius,
    this.strokeWidth = 3,
  });

  final double rotation;
  final List<Color> colors;
  final double radius;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final inset = strokeWidth / 2;
    final rect = (Offset.zero & size).deflate(inset);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius - inset));

    final shader = SweepGradient(
      transform: GradientRotation(rotation * 2 * math.pi),
      colors: colors,
    ).createShader(rect);

    final paint = Paint()
      ..shader = shader
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter oldDelegate) =>
      oldDelegate.rotation != rotation || !listEquals(oldDelegate.colors, colors);
}

class _FeaturePage extends StatelessWidget {
  final FeatureHighlight highlight;

  const _FeaturePage({required this.highlight});

  @override
  Widget build(BuildContext context) {
    final scheme = context.colorScheme;

    return SingleChildScrollView(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest,
                borderRadius: const BorderRadius.all(Radius.circular(18)),
                border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.all(Radius.circular(18)),
                child: SizedBox(
                  width: double.infinity,
                  height: 256,
                  child: highlight.image == null
                      ? const FeatureMessagePlaceholder()
                      : Image.asset(
                          highlight.image!,
                          fit: BoxFit.contain,
                          errorBuilder: (context, _, __) => const FeatureMessagePlaceholder(),
                        ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 18, 24, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  highlight.titleKey.tr(),
                  style: context.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  highlight.bodyKey.tr(),
                  style: context.textTheme.bodyLarge?.copyWith(color: scheme.onSurfaceVariant, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PageDots extends StatelessWidget {
  final PageController controller;
  final int index;
  final int count;

  const _PageDots({required this.controller, required this.index, required this.count});

  @override
  Widget build(BuildContext context) {
    final primary = context.primaryColor;

    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final page = controller.hasClients ? (controller.page ?? index.toDouble()) : index.toDouble();
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(count, (i) {
            final activeness = (1 - (page - i).abs()).clamp(0.0, 1.0);
            return AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: 7,
              width: 7 + 16 * activeness,
              decoration: BoxDecoration(
                color: Color.lerp(context.colorScheme.surfaceContainerHighest, primary, activeness),
                borderRadius: const BorderRadius.all(Radius.circular(8)),
              ),
            );
          }),
        );
      },
    );
  }
}
