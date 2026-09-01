import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';

class TagsDetails extends ConsumerWidget {
  final BaseAsset asset;

  const TagsDetails({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final tags = ref.watch(assetTagsProvider(asset.id)).valueOrNull;
    if (tags == null || tags.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              context.t.tags,
              style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
            ),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final tag in tags)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: context.primaryColor.withAlpha(25),
                    borderRadius: const BorderRadius.all(Radius.circular(16)),
                  ),
                  child: Text(tag.value, style: context.textTheme.bodyMedium),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
