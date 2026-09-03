import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/tag_tree.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/tags/tag_options.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/error_handler.dart';

@RoutePage()
class TagsPage extends ConsumerWidget {
  final String path;

  const TagsPage({super.key, this.path = ''});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tags = ref.watch(tagsTreeProvider);
    final title = path.isEmpty ? context.t.tags : path;

    // The tag currently being viewed (null at the root or before tags load).
    final node = tags.valueOrNull == null ? null : TagTreeNode.fromTags(tags.valueOrNull!).traverse(path);
    final isRealTag = path.isNotEmpty && node?.id != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: context.t.create_tag,
            onPressed: () => _showCreateTagDialog(context, ref, parentPath: path),
          ),
          if (isRealTag) TagOptionsMenu(id: node!.id!, leafName: node.value, path: node.path, color: node.color),
        ],
      ),
      body: tags.widgetWhen(
        onData: (allTags) {
          final current = TagTreeNode.fromTags(allTags).traverse(path);
          final children = current.children..sort((a, b) => a.value.toLowerCase().compareTo(b.value.toLowerCase()));

          // A tile to view the assets tagged directly with the tag being browsed,
          // shown alongside its sub-tags.
          final showPhotos = path.isNotEmpty && current.id != null;

          if (children.isEmpty && !showPhotos) {
            return Center(child: Text(context.t.no_tags, style: context.textTheme.bodyLarge));
          }

          final isTablet = context.width > 600;
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isTablet ? 6 : 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 0.85,
            ),
            itemCount: children.length + (showPhotos ? 1 : 0),
            itemBuilder: (context, index) {
              if (showPhotos && index == 0) {
                return _GridTile(
                  icon: Icons.photo_library_outlined,
                  label: context.t.view_photos,
                  onTap: () => unawaited(
                    context.pushRoute(
                      TagTimelineRoute(tagId: current.id!, tagName: current.path, tagColor: current.color),
                    ),
                  ),
                );
              }
              final node = children[index - (showPhotos ? 1 : 0)];
              return _GridTile(
                icon: Icons.sell,
                iconColor: parseTagColor(node.color),
                label: node.path,
                onTap: () => _openTag(context, node),
              );
            },
          );
        },
      ),
    );
  }
}

void _openTag(BuildContext context, TagTreeNode node) {
  if (node.hasChildren) {
    unawaited(context.pushRoute(TagsRoute(path: node.path)));
  } else if (node.id != null) {
    unawaited(context.pushRoute(TagTimelineRoute(tagId: node.id!, tagName: node.path, tagColor: node.color)));
  }
}

class _GridTile extends StatelessWidget {
  const _GridTile({required this.icon, required this.label, required this.onTap, this.iconColor});

  final IconData icon;
  final Color? iconColor;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: const BorderRadius.all(Radius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 56, color: iconColor ?? context.primaryColor),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: context.textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _showCreateTagDialog(BuildContext context, WidgetRef ref, {required String parentPath}) async {
  final controller = TextEditingController();
  final prefix = parentPath.isEmpty ? '' : '$parentPath/';

  final name = await showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(context.t.create_tag),
      content: StatefulBuilder(
        builder: (context, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: controller,
              autofocus: true,
              decoration: InputDecoration(labelText: context.t.tag),
              onChanged: (_) => setState(() {}),
              onSubmitted: (value) => Navigator.of(context).pop(value),
            ),
            if (prefix.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  context.t.tag_full_path(tag: '$prefix${controller.text}'),
                  style: context.textTheme.bodySmall,
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(context.t.cancel)),
        TextButton(onPressed: () => Navigator.of(context).pop(controller.text), child: Text(context.t.create)),
      ],
    ),
  );

  final trimmed = name?.trim();
  if (trimmed == null || trimmed.isEmpty || !context.mounted) {
    return;
  }

  try {
    final created = await ref.read(tagProvider.notifier).upsertTags(['$prefix$trimmed']);
    ref.invalidate(assetTagsProvider);
    if (context.mounted && created.isNotEmpty) {
      ref.read(toastServiceProvider).success(context.t.tag_created(tag: created.first.value));
    }
  } catch (error, stack) {
    handleError(error, stack: stack, description: "Failed to create the tag");
  }
}
