import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

String _trimSlashes(String s) => s.replaceAll(RegExp(r'^/+|/+$'), '');

Future<(Set<String>, Set<String>)?> showTagPickerModal({
  required BuildContext context,
  Set<String>? initialSelection,
  bool privateOnly = false,
}) {
  return showDialog<(Set<String>, Set<String>)?>(
    context: context,
    builder: (context) => _TagPickerModal(initialSelection: initialSelection, privateOnly: privateOnly),
  );
}

class _TagPickerModal extends HookConsumerWidget {
  final Set<String>? initialSelection;
  final bool privateOnly;

  const _TagPickerModal({this.initialSelection, required this.privateOnly});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedTagIds = useState<Set<String>>(initialSelection ?? {});
    final newTagValues = useState<Set<String>>({});
    final unlocked = ref.watch(privateContentVisibleProvider);
    ref.listen(privateSessionProvider, (_, unlocked) {
      if (!unlocked) {
        selectedTagIds.value = {};
        newTagValues.value = {};
      }
    });

    void onSelectExistingTag(Iterable<Tag> tags) {
      selectedTagIds.value = tags.map((tag) => tag.id).toSet();
    }

    void onSelectNewTag(Set<String> tags) {
      newTagValues.value = tags;
    }

    return AlertDialog(
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 0),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            context.t.cancel,
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ),
        ),
        TextButton(
          onPressed: privateOnly && !unlocked ? null : () => context.pop((selectedTagIds.value, newTagValues.value)),
          child: Text(
            context.t.action_common_update,
            style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
          ),
        ),
      ],
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        height: MediaQuery.of(context).size.height * 0.6,
        child: TagPicker(
          onSelectExistingTag: onSelectExistingTag,
          initialSelection: selectedTagIds.value,
          onSelectNewTag: privateOnly ? null : onSelectNewTag,
          privateOnly: privateOnly,
        ),
      ),
    );
  }
}

class TagPicker extends HookConsumerWidget {
  const TagPicker({
    super.key,
    required this.onSelectExistingTag,
    required this.initialSelection,
    this.onSelectNewTag,
    this.privateOnly = false,
    this.includePrivate = true,
  });

  final Set<String> initialSelection;
  final bool privateOnly;
  final bool includePrivate;

  /// Callback when existing tags are selected/deselected.
  final Function(Iterable<Tag>) onSelectExistingTag;

  /// If not null, shows a tile to create a new tag with user's filter input.
  final Function(Set<String>)? onSelectNewTag;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formFocus = useFocusNode();
    final searchQuery = useState('');
    final tags = ref.watch(Store.tags.all());
    final showPrivate = includePrivate && ref.watch(privateContentVisibleProvider);
    final selectedTagIds = useState<Set<String>>(initialSelection);
    const borderRadius = BorderRadius.all(Radius.circular(20));
    final selectedNewTagValues = useState<Set<String>>({});

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: SearchField(
            focusNode: formFocus,
            onChanged: (value) => searchQuery.value = value,
            onTapOutside: (_) => formFocus.unfocus(),
            filled: true,
            hintText: context.t.filter_tags,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 8.0),
          child: Divider(height: 1, color: context.colorScheme.surfaceContainerHighest, thickness: 1),
        ),
        Expanded(
          child: tags.widgetWhen(
            skipLoadingOnRefresh: false,
            onData: (tags) {
              final trimmedQuery = _trimSlashes(searchQuery.value);
              final available = tags.where((tag) {
                final private = tags.isEffectivelyPrivate(tag);
                return privateOnly ? showPrivate && private : showPrivate || !private;
              });
              final queryResult = available
                  .where((t) => t.value.toLowerCase().contains(trimmedQuery.toLowerCase()))
                  .toList();
              final showCreateTile =
                  (onSelectNewTag != null) &&
                  trimmedQuery.isNotEmpty &&
                  !tags.any((t) => t.value.toLowerCase() == trimmedQuery.toLowerCase());
              final isCreateSelected = selectedNewTagValues.value.contains(trimmedQuery);
              // ListTile paints its tile color on the nearest Material, clip it to the list
              return Material(
                type: MaterialType.transparency,
                clipBehavior: Clip.hardEdge,
                child: ListView.builder(
                  itemCount: queryResult.length + (showCreateTile ? 1 : 0),
                  padding: const EdgeInsets.all(8),
                  itemBuilder: (context, index) {
                    if (showCreateTile && index == queryResult.length) {
                      // Create new tag tile
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 2.0),
                        child: ListTile(
                          shape: const RoundedRectangleBorder(borderRadius: borderRadius),
                          selected: isCreateSelected,
                          selectedTileColor: context.primaryColor,
                          tileColor: context.primaryColor.withAlpha(25),
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
                      padding: const EdgeInsets.only(bottom: 7.0, right: 2.0, left: 2.0),
                      child: ListTile(
                        shape: const RoundedRectangleBorder(borderRadius: borderRadius),
                        selected: isSelected,
                        selectedTileColor: context.primaryColor,
                        tileColor: context.primaryColor.withAlpha(25),
                        leading: tags.isEffectivelyPrivate(tag) ? const Icon(Icons.lock_outline) : null,
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
                          onSelectExistingTag(available.where((t) => newSelected.contains(t.id)));
                        },
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
