import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

Color? parseTagColor(String? hex) {
  if (hex == null) {
    return null;
  }
  final value = int.tryParse(hex.replaceFirst('#', ''), radix: 16);
  return value == null ? null : Color(0xFF000000 | value);
}

const _tagColors = <String>[
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#78716C',
];

enum _TagMenuAction { edit, delete }

class TagOptionsMenu extends ConsumerWidget {
  const TagOptionsMenu({
    super.key,
    required this.id,
    required this.leafName,
    required this.path,
    this.color,
    this.iconColor,
  });

  final String id;

  /// The tag's leaf name (edited in place); the server recomposes the full path.
  final String leafName;

  /// The tag's full `/`-delimited path, shown in prompts.
  final String path;
  final String? color;
  final Color? iconColor;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopupMenuButton<_TagMenuAction>(
      icon: Icon(Icons.more_vert, color: iconColor),
      onSelected: (action) async {
        switch (action) {
          case _TagMenuAction.edit:
            await _showEditTagDialog(context, ref, id: id, leafName: leafName, color: color);
          case _TagMenuAction.delete:
            await _confirmDeleteTag(context, ref, id: id, path: path);
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          value: _TagMenuAction.edit,
          child: ListTile(leading: const Icon(Icons.edit_outlined), title: Text(context.t.edit_tag)),
        ),
        PopupMenuItem(
          value: _TagMenuAction.delete,
          child: ListTile(
            leading: Icon(Icons.delete_outline, color: context.colorScheme.error),
            title: Text(context.t.delete_tag, style: TextStyle(color: context.colorScheme.error)),
          ),
        ),
      ],
    );
  }
}

Future<void> _showEditTagDialog(
  BuildContext context,
  WidgetRef ref, {
  required String id,
  required String leafName,
  required String? color,
}) async {
  final controller = TextEditingController(text: leafName);
  var selectedColor = color;

  final result = await showDialog<(String, String?)>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(context.t.edit_tag),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: controller,
              autofocus: true,
              decoration: InputDecoration(labelText: context.t.name),
            ),
            const SizedBox(height: 20),
            Text(context.t.color, style: context.textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _ColorSwatch(
                  color: null,
                  isSelected: selectedColor == null,
                  onTap: () => setState(() => selectedColor = null),
                ),
                for (final option in _tagColors)
                  _ColorSwatch(
                    color: option,
                    isSelected: selectedColor?.toUpperCase() == option,
                    onTap: () => setState(() => selectedColor = option),
                  ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(context.t.cancel)),
          TextButton(
            onPressed: () => Navigator.of(context).pop((controller.text, selectedColor)),
            child: Text(context.t.save),
          ),
        ],
      ),
    ),
  );

  if (result == null || !context.mounted) {
    return;
  }

  final (rawName, newColor) = result;
  final trimmed = rawName.trim();
  if (trimmed.isEmpty || (trimmed == leafName && newColor == color)) {
    return;
  }

  try {
    final updated = await ref.read(tagProvider.notifier).updateTag(id, name: trimmed, color: newColor);
    ref.invalidate(assetTagsProvider);
    if (context.mounted && updated != null) {
      ref.read(toastServiceProvider).success(context.t.tag_updated(tag: updated.value));
    }
  } catch (error, stack) {
    handleError(error, stack: stack, description: "Failed to update the tag");
  }
}

Future<void> _confirmDeleteTag(BuildContext context, WidgetRef ref, {required String id, required String path}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(context.t.delete_tag),
      content: Text(context.t.delete_tag_confirmation_prompt(tagName: path)),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(context.t.cancel)),
        TextButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: Text(context.t.delete, style: TextStyle(color: context.colorScheme.error)),
        ),
      ],
    ),
  );

  if (confirmed != true || !context.mounted) {
    return;
  }

  try {
    await ref.read(tagProvider.notifier).deleteTag(id);
    ref.invalidate(assetTagsProvider);
  } catch (error, stack) {
    handleError(error, stack: stack, description: "Failed to delete the tag");
  }
}

class _ColorSwatch extends StatelessWidget {
  const _ColorSwatch({required this.color, required this.isSelected, required this.onTap});

  final String? color;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final swatchColor = parseTagColor(color);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: swatchColor ?? context.colorScheme.surfaceContainerHighest,
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? context.primaryColor : context.colorScheme.outlineVariant,
            width: isSelected ? 3 : 1,
          ),
        ),
        child: color == null ? Icon(Icons.block, size: 18, color: context.colorScheme.onSurfaceSecondary) : null,
      ),
    );
  }
}
