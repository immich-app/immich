import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class ConstantsPage extends StatefulWidget {
  const ConstantsPage({super.key});

  @override
  State<ConstantsPage> createState() => _ConstantsPageState();
}

class _ConstantsPageState extends State<ConstantsPage> {
  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.constants.name,
      child: ComponentExamples(
        title: 'Constants',
        subtitle: 'Consistent spacing, sizing, and styling constants.',
        expand: true,
        examples: [
          const ExampleCard(
            title: 'Spacing',
            description: 'ImmichSpacing (4.0 → 48.0)',
            preview: Column(
              children: [
                _SpacingBox(label: 'xs', size: ImmichSpacing.xs),
                _SpacingBox(label: 'sm', size: ImmichSpacing.sm),
                _SpacingBox(label: 'md', size: ImmichSpacing.md),
                _SpacingBox(label: 'lg', size: ImmichSpacing.lg),
                _SpacingBox(label: 'xl', size: ImmichSpacing.xl),
                _SpacingBox(label: 'xxl', size: ImmichSpacing.xxl),
                _SpacingBox(label: 'xxxl', size: ImmichSpacing.xxxl),
              ],
            ),
          ),
          const ExampleCard(
            title: 'Border Radius',
            description: 'ImmichRadius (0.0 → 24.0)',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _RadiusBox(label: 'none', radius: ImmichRadius.none),
                _RadiusBox(label: 'xs', radius: ImmichRadius.xs),
                _RadiusBox(label: 'sm', radius: ImmichRadius.sm),
                _RadiusBox(label: 'md', radius: ImmichRadius.md),
                _RadiusBox(label: 'lg', radius: ImmichRadius.lg),
                _RadiusBox(label: 'xl', radius: ImmichRadius.xl),
                _RadiusBox(label: 'xxl', radius: ImmichRadius.xxl),
              ],
            ),
          ),
          const ExampleCard(
            title: 'Icon Sizes',
            description: 'ImmichIconSize (16.0 → 48.0)',
            preview: Wrap(
              spacing: 16,
              runSpacing: 16,
              alignment: WrapAlignment.start,
              children: [
                _IconSizeBox(label: 'xs', size: ImmichIconSize.xs),
                _IconSizeBox(label: 'sm', size: ImmichIconSize.sm),
                _IconSizeBox(label: 'md', size: ImmichIconSize.md),
                _IconSizeBox(label: 'lg', size: ImmichIconSize.lg),
                _IconSizeBox(label: 'xl', size: ImmichIconSize.xl),
                _IconSizeBox(label: 'xxl', size: ImmichIconSize.xxl),
              ],
            ),
          ),
          const ExampleCard(
            title: 'Text Sizes',
            description: 'ImmichTextSize (10.0 → 60.0)',
            preview: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Caption',
                  style: TextStyle(fontSize: ImmichTextSize.caption),
                ),
                Text('Label', style: TextStyle(fontSize: ImmichTextSize.label)),
                Text('Body', style: TextStyle(fontSize: ImmichTextSize.body)),
                Text('H6', style: TextStyle(fontSize: ImmichTextSize.h6)),
                Text('H5', style: TextStyle(fontSize: ImmichTextSize.h5)),
                Text('H4', style: TextStyle(fontSize: ImmichTextSize.h4)),
                Text('H3', style: TextStyle(fontSize: ImmichTextSize.h3)),
                Text('H2', style: TextStyle(fontSize: ImmichTextSize.h2)),
                Text('H1', style: TextStyle(fontSize: ImmichTextSize.h1)),
              ],
            ),
          ),
          const ExampleCard(
            title: 'Elevation',
            description: 'ImmichElevation (0.0 → 16.0)',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _ElevationBox(label: 'none', elevation: ImmichElevation.none),
                _ElevationBox(label: 'xs', elevation: ImmichElevation.xs),
                _ElevationBox(label: 'sm', elevation: ImmichElevation.sm),
                _ElevationBox(label: 'md', elevation: ImmichElevation.md),
                _ElevationBox(label: 'lg', elevation: ImmichElevation.lg),
                _ElevationBox(label: 'xl', elevation: ImmichElevation.xl),
                _ElevationBox(label: 'xxl', elevation: ImmichElevation.xxl),
              ],
            ),
          ),
          const ExampleCard(
            title: 'Border Width',
            description: 'ImmichBorderWidth (0.5 → 4.0)',
            preview: Column(
              children: [
                _BorderBox(
                  label: 'hairline',
                  borderWidth: ImmichBorderWidth.hairline,
                ),
                _BorderBox(label: 'base', borderWidth: ImmichBorderWidth.base),
                _BorderBox(label: 'md', borderWidth: ImmichBorderWidth.md),
                _BorderBox(label: 'lg', borderWidth: ImmichBorderWidth.lg),
                _BorderBox(label: 'xl', borderWidth: ImmichBorderWidth.xl),
              ],
            ),
          ),
          const ExampleCard(
            title: 'Animation Durations',
            description: 'ImmichDuration (100ms → 700ms)',
            preview: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 8,
              children: [
                _AnimatedDurationBox(
                  label: 'Extra Fast',
                  duration: ImmichDuration.extraFast,
                ),
                _AnimatedDurationBox(
                  label: 'Fast',
                  duration: ImmichDuration.fast,
                ),
                _AnimatedDurationBox(
                  label: 'Normal',
                  duration: ImmichDuration.normal,
                ),
                _AnimatedDurationBox(
                  label: 'Slow',
                  duration: ImmichDuration.slow,
                ),
                _AnimatedDurationBox(
                  label: 'Extra Slow',
                  duration: ImmichDuration.extraSlow,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SpacingBox extends StatelessWidget {
  final String label;
  final double size;

  const _SpacingBox({required this.label, required this.size});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 60,
            child: Text(
              label,
              style: const TextStyle(fontFamily: 'GoogleSansCode'),
            ),
          ),
          Container(
            width: size,
            height: 24,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Text('${size.toStringAsFixed(1)}px'),
        ],
      ),
    );
  }
}

class _RadiusBox extends StatelessWidget {
  final String label;
  final double radius;

  const _RadiusBox({required this.label, required this.radius});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class _IconSizeBox extends StatelessWidget {
  final String label;
  final double size;

  const _IconSizeBox({required this.label, required this.size});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(Icons.palette_rounded, size: size),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
        Text(
          '${size.toStringAsFixed(0)}px',
          style: const TextStyle(fontSize: 10, color: Colors.grey),
        ),
      ],
    );
  }
}

class _ElevationBox extends StatelessWidget {
  final String label;
  final double elevation;

  const _ElevationBox({required this.label, required this.elevation});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          elevation: elevation,
          borderRadius: const BorderRadius.all(Radius.circular(8)),
          child: Container(
            width: 60,
            height: 60,
            alignment: Alignment.center,
            child: Text(label, style: const TextStyle(fontSize: 12)),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          elevation.toStringAsFixed(1),
          style: const TextStyle(fontSize: 10),
        ),
      ],
    );
  }
}

class _BorderBox extends StatelessWidget {
  final String label;
  final double borderWidth;

  const _BorderBox({required this.label, required this.borderWidth});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(fontFamily: 'GoogleSansCode'),
            ),
          ),
          Expanded(
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Theme.of(context).colorScheme.primary,
                  width: borderWidth,
                ),
                borderRadius: const BorderRadius.all(Radius.circular(4)),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text('${borderWidth.toStringAsFixed(1)}px'),
        ],
      ),
    );
  }
}

class _AnimatedDurationBox extends StatefulWidget {
  final String label;
  final Duration duration;

  const _AnimatedDurationBox({required this.label, required this.duration});

  @override
  State<_AnimatedDurationBox> createState() => _AnimatedDurationBoxState();
}

class _AnimatedDurationBoxState extends State<_AnimatedDurationBox> {
  bool _atEnd = false;
  bool _isAnimating = false;

  void _playAnimation() async {
    if (_isAnimating) return;
    setState(() => _isAnimating = true);
    setState(() => _atEnd = true);
    await Future.delayed(widget.duration);
    if (!mounted) return;
    setState(() => _atEnd = false);
    await Future.delayed(widget.duration);
    if (!mounted) return;
    setState(() => _isAnimating = false);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        SizedBox(
          width: 90,
          child: Text(
            widget.label,
            style: const TextStyle(fontFamily: 'GoogleSansCode', fontSize: 12),
          ),
        ),
        Expanded(
          child: Container(
            height: 32,
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(6),
            ),
            child: AnimatedAlign(
              duration: widget.duration,
              curve: Curves.easeInOut,
              alignment: _atEnd ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 60,
                height: 28,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${widget.duration.inMilliseconds}ms',
                  style: TextStyle(
                    fontSize: 11,
                    color: colorScheme.onPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _isAnimating ? null : _playAnimation,
          icon: Icon(
            Icons.play_arrow_rounded,
            color: _isAnimating ? colorScheme.outline : colorScheme.primary,
          ),
          iconSize: 24,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
        ),
      ],
    );
  }
}
