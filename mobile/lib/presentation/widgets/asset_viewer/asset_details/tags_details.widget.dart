import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';

class TagsDetails extends ConsumerWidget {
  final BaseAsset asset;

  const TagsDetails({super.key, required this.asset});

  Future<void> _addTags(BuildContext context, WidgetRef ref, RemoteAsset asset) async {
    final results = await showTagPickerModal(context: context);
    if (results == null || !context.mounted) {
      return;
    }

    final (selected, created) = results;
    final tagService = ref.read(tagServiceProvider);
    final tagIds = {...selected};

    try {
      if (created.isNotEmpty) {
        final ownerId = ref.read(currentUserProvider)?.id;
        final tags = await tagService.upsertTags(created.toList(), ownerId: ownerId);
        tagIds.addAll(tags.map((tag) => tag.id));
      }
      if (tagIds.isEmpty) {
        return;
      }

      final count = await tagService.bulkTagAssets([asset.id], tagIds.toList());
      ref.invalidate(tagProvider);
      ref.invalidate(assetTagsProvider(asset.id));
      if (context.mounted) {
        ref.read(toastServiceProvider).success(context.t.tagged_assets(count: count));
      }
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to tag the asset");
    }
  }

  Future<void> _removeTag(BuildContext context, WidgetRef ref, RemoteAsset asset, Tag tag) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.t.remove_tag),
        content: Text(context.t.remove_tag_confirmation_prompt(tagName: tag.value)),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(context.t.cancel)),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(context.t.remove, style: TextStyle(color: context.colorScheme.error)),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    try {
      await ref.read(tagServiceProvider).untagAssets(tag.id, [asset.id]);
      ref.invalidate(assetTagsProvider(asset.id));
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to remove the tag");
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final tagsEnabled = ref.watch(
      userMetadataPreferencesProvider.select((value) => value.valueOrNull?.tagsEnabled ?? false),
    );

    final tags = ref.watch(assetTagsProvider(asset.id)).valueOrNull ?? const [];
    if (!tagsEnabled && tags.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
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
                _TagBadge(
                  label: tag.value,
                  onTap: () => unawaited(
                    context.pushRoute(TagTimelineRoute(tagId: tag.id, tagName: tag.value, tagColor: tag.color)),
                  ),
                  onRemove: tagsEnabled ? () => _removeTag(context, ref, asset, tag) : null,
                ),
              if (tagsEnabled)
                InkWell(
                  onTap: () => _addTags(context, ref, asset),
                  borderRadius: const BorderRadius.all(Radius.circular(16)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: context.primaryColor.withAlpha(25),
                      borderRadius: const BorderRadius.all(Radius.circular(16)),
                    ),
                    child: Icon(Icons.add, size: 18, color: context.primaryColor),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TagBadge extends StatelessWidget {
  const _TagBadge({required this.label, required this.onTap, this.onRemove});

  final String label;
  final VoidCallback onTap;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: const BorderRadius.all(Radius.circular(16)),
      child: Container(
        padding: EdgeInsets.only(left: 12, right: onRemove == null ? 12 : 6, top: 6, bottom: 6),
        decoration: BoxDecoration(
          color: context.primaryColor.withAlpha(25),
          borderRadius: const BorderRadius.all(Radius.circular(16)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: context.textTheme.bodyMedium),
            if (onRemove != null) ...[
              const SizedBox(width: 4),
              InkWell(
                onTap: onRemove,
                child: Icon(Icons.close, size: 16, color: context.colorScheme.onSurfaceSecondary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
