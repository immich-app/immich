import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/feature_message.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

Future<void> showFeatureMessageDialog(BuildContext context) {
  return showGeneralDialog<void>(
    context: context,
    useRootNavigator: true,
    barrierDismissible: true,
    barrierLabel: 'whats_new'.tr(),
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

class _FeatureMessageDialogState extends State<_FeatureMessageDialog> {
  final PageController _controller = PageController();
  int _index = 0;

  bool get _isLast => _index >= featureMessageHighlights.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _advance() {
    if (_isLast) {
      Navigator.of(context).pop();
      return;
    }
    _controller.nextPage(duration: const Duration(milliseconds: 320), curve: Curves.easeOutCubic);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 64),
      clipBehavior: Clip.antiAlias,
      backgroundColor: context.isDarkTheme ? context.colorScheme.surfaceContainerLow : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        side: BorderSide(color: context.primaryColor.withValues(alpha: 0.85), width: 5),
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
                  Text('whats_new'.tr(), style: context.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(
                    'feature_message_version'.tr(namedArgs: {'version': featureMessageReleaseLabel}),
                    style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 64),

            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: featureMessageHighlights.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, index) => _FeaturePage(highlight: featureMessageHighlights[index]),
              ),
            ),
            const SizedBox(height: 8),
            _PageDots(controller: _controller, index: _index, count: featureMessageHighlights.length),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
              child: Row(
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14)),
                    child: Text('skip'.tr()),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(100),
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
                          textStyle: context.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 16),
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          child: Text(_isLast ? 'ok'.tr() : 'next'.tr(), key: ValueKey(_isLast)),
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
    );
  }
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
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: ColoredBox(
                color: scheme.surfaceContainerHighest,
                child: SizedBox(
                  width: double.infinity,
                  height: 300,
                  child: Image.asset(
                    highlight.image,
                    fit: BoxFit.contain,
                    errorBuilder: (context, _, __) =>
                        Center(child: Icon(Icons.auto_awesome_outlined, color: scheme.onSurfaceVariant, size: 56)),
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
                  style: context.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 28),
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
                borderRadius: BorderRadius.circular(8),
              ),
            );
          }),
        );
      },
    );
  }
}
