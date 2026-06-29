import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/feature_message.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

Future<void> showFeatureMessageSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    useRootNavigator: true,
    builder: (_) => const _FeatureMessageSheet(),
  );
}

class _FeatureMessageSheet extends StatelessWidget {
  const _FeatureMessageSheet();

  @override
  Widget build(BuildContext context) {
    return BaseBottomSheet(
      actions: const [],
      resizeOnScroll: false,
      expand: false,
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 4, 24, 16),
            child: Text(
              'whats_new'.tr(),
              style: context.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ),
        SliverList.separated(
          itemCount: visibleFeatureMessageHighlights.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, index) => _HighlightCard(highlight: visibleFeatureMessageHighlights[index]),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 16)),
      ],
      footer: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text('got_it'.tr()),
            ),
          ),
        ),
      ),
    );
  }
}

class _HighlightCard extends StatelessWidget {
  final FeatureHighlight highlight;

  const _HighlightCard({required this.highlight});

  Widget _placeholder(BuildContext context) => ColoredBox(
    color: context.colorScheme.surfaceContainerHigh,
    child: Center(child: Icon(Icons.local_fire_department_rounded, color: context.colorScheme.primary, size: 48)),
  );

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: highlight.image == null
                  ? _placeholder(context)
                  : Image.asset(
                      highlight.image!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, _, __) => _placeholder(context),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Text(highlight.titleKey.tr(), style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            highlight.bodyKey.tr(),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
