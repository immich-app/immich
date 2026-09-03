import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

String _trimSlashes(String s) => s.replaceAll(RegExp(r'^/+|/+$'), '');

Future<(Set<String>, Set<String>)?> showTagPickerModal({
  required BuildContext context,
  Set<String>? initialSelection,
  String? title,
  String? submitLabel,
}) {
  return showDialog<(Set<String>, Set<String>)?>(
    context: context,
    builder: (context) => _TagPickerModal(
      initialSelection: initialSelection,
      title: title ?? context.t.tag_assets,
      submitLabel: submitLabel ?? context.t.tag_assets,
    ),
  );
}

class _TagPickerModal extends HookWidget {
  final Set<String>? initialSelection;
  final String title;
  final String submitLabel;

  const _TagPickerModal({this.initialSelection, required this.title, required this.submitLabel});

  @override
  Widget build(BuildContext context) {
    final selectedTagIds = useState<Set<String>>(initialSelection ?? {});
    final newTagValues = useState<Set<String>>({});

    return AlertDialog(
      titlePadding: const EdgeInsets.fromLTRB(24, 20, 12, 0),
      contentPadding: const EdgeInsets.only(top: 8),
      title: Row(
        children: [
          Icon(Icons.sell_outlined, color: context.primaryColor),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: context.textTheme.titleLarge)),
          IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            context.t.cancel,
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop((selectedTagIds.value, newTagValues.value)),
          child: Text(
            submitLabel,
            style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
          ),
        ),
      ],
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        height: MediaQuery.of(context).size.height * 0.6,
        child: TagPicker(
          showSelectedPills: true,
          filter: selectedTagIds.value,
          onSelectExistingTag: (tags) => selectedTagIds.value = tags.map((tag) => tag.id).toSet(),
          onSelectNewTag: (tags) => newTagValues.value = tags,
        ),
      ),
    );
  }
}

class TagPicker extends HookConsumerWidget {
  const TagPicker({
    super.key,
    required this.onSelectExistingTag,
    required this.filter,
    this.onSelectNewTag,
    this.showSelectedPills = false,
  });

  final Set<String> filter;

  /// Callback when existing tags are selected/deselected.
  final Function(Iterable<Tag>) onSelectExistingTag;

  /// If not null, shows a tile to create a new tag with user's filter input.
  final Function(Set<String>)? onSelectNewTag;

  /// Whether to show the currently selected tags as removable pills above the list.
  final bool showSelectedPills;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formFocus = useFocusNode();
    final searchController = useTextEditingController();
    final searchQuery = useState('');
    final tags = ref.watch(tagProvider);
    final selectedTagIds = useState<Set<String>>(filter);
    final selectedNewTagValues = useState<Set<String>>({});
    const borderRadius = BorderRadius.all(Radius.circular(10));

    void removeExistingTag(Iterable<Tag> allTags, String id) {
      final newSelected = {...selectedTagIds.value}..remove(id);
      selectedTagIds.value = newSelected;
      onSelectExistingTag(allTags.where((t) => newSelected.contains(t.id)));
    }

    void removeNewTag(String value) {
      final newValues = {...selectedNewTagValues.value}..remove(value);
      selectedNewTagValues.value = newValues;
      onSelectNewTag?.call(newValues);
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: SearchField(
            controller: searchController,
            focusNode: formFocus,
            onChanged: (value) => searchQuery.value = value,
            onTapOutside: (_) => formFocus.unfocus(),
            filled: true,
            hintText: context.t.search_tags,
            prefixIcon: const Icon(Icons.search),
            suffixIcon: searchQuery.value.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      searchController.clear();
                      searchQuery.value = '';
                    },
                  ),
          ),
        ),
        if (showSelectedPills)
          _SelectedPills(
            tags: tags.valueOrNull ?? const {},
            selectedTagIds: selectedTagIds.value,
            newTagValues: selectedNewTagValues.value,
            onRemoveExisting: (id) => removeExistingTag(tags.valueOrNull ?? const {}, id),
            onRemoveNew: removeNewTag,
          ),
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 0),
          child: Divider(color: context.colorScheme.surfaceContainerHighest, thickness: 1),
        ),
        Expanded(
          child: tags.widgetWhen(
            onData: (tags) {
              final trimmedQuery = _trimSlashes(searchQuery.value);
              final queryResult = tags
                  .where((t) => t.value.toLowerCase().contains(trimmedQuery.toLowerCase()))
                  .toList();
              final showCreateTile =
                  (onSelectNewTag != null) &&
                  trimmedQuery.isNotEmpty &&
                  !tags.any((t) => t.value.toLowerCase() == trimmedQuery.toLowerCase());
              final isCreateSelected = selectedNewTagValues.value.contains(trimmedQuery);
              return ListView.builder(
                itemCount: queryResult.length + (showCreateTile ? 1 : 0),
                padding: const EdgeInsets.all(8),
                itemBuilder: (context, index) {
                  if (showCreateTile && index == queryResult.length) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 2.0),
                      child: ListTile(
                        tileColor: isCreateSelected ? context.primaryColor : context.primaryColor.withAlpha(25),
                        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                        title: Text(
                          trimmedQuery,
                          style: context.textTheme.bodyLarge?.copyWith(
                            color: isCreateSelected ? context.colorScheme.onPrimary : context.colorScheme.onSurface,
                          ),
                        ),
                        trailing: Icon(
                          Icons.add,
                          color: isCreateSelected ? context.colorScheme.onPrimary : context.colorScheme.onSurface,
                        ),
                        onTap: () {
                          final newSelectedNewTagValues = {...selectedNewTagValues.value};
                          if (isCreateSelected) {
                            newSelectedNewTagValues.remove(trimmedQuery);
                          } else {
                            newSelectedNewTagValues.add(trimmedQuery);
                          }
                          selectedNewTagValues.value = newSelectedNewTagValues;
                          onSelectNewTag!.call(newSelectedNewTagValues);
                        },
                      ),
                    );
                  }
                  final tag = queryResult[index];
                  final isSelected = selectedTagIds.value.any((id) => id == tag.id);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2.0),
                    child: ListTile(
                      tileColor: isSelected ? context.primaryColor : context.primaryColor.withAlpha(25),
                      shape: const RoundedRectangleBorder(borderRadius: borderRadius),
                      title: Text(
                        tag.value,
                        style: context.textTheme.bodyLarge?.copyWith(
                          color: isSelected ? context.colorScheme.onPrimary : context.colorScheme.onSurface,
                        ),
                      ),
                      onTap: () {
                        final newSelected = {...selectedTagIds.value};
                        if (isSelected) {
                          newSelected.removeWhere((id) => id == tag.id);
                        } else {
                          newSelected.add(tag.id);
                        }
                        selectedTagIds.value = newSelected;
                        onSelectExistingTag(tags.where((t) => newSelected.contains(t.id)));
                      },
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _SelectedPills extends StatelessWidget {
  const _SelectedPills({
    required this.tags,
    required this.selectedTagIds,
    required this.newTagValues,
    required this.onRemoveExisting,
    required this.onRemoveNew,
  });

  final Set<Tag> tags;
  final Set<String> selectedTagIds;
  final Set<String> newTagValues;
  final void Function(String id) onRemoveExisting;
  final void Function(String value) onRemoveNew;

  @override
  Widget build(BuildContext context) {
    final selectedTags = tags.where((t) => selectedTagIds.contains(t.id));
    if (selectedTags.isEmpty && newTagValues.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final tag in selectedTags) _Pill(label: tag.value, onRemove: () => onRemoveExisting(tag.id)),
          for (final value in newTagValues) _Pill(label: value, onRemove: () => onRemoveNew(value)),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.onRemove});

  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 12, right: 6, top: 6, bottom: 6),
      decoration: BoxDecoration(color: context.primaryColor, borderRadius: const BorderRadius.all(Radius.circular(16))),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onPrimary)),
          const SizedBox(width: 4),
          InkWell(
            onTap: onRemove,
            child: Icon(Icons.close, size: 16, color: context.colorScheme.onPrimary),
          ),
        ],
      ),
    );
  }
}
