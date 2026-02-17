import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

Future<(Set<String>, Set<String>)?> showTagPickerModal({required BuildContext context, Set<String>? excludeTagIds}) {
  return showDialog<(Set<String>, Set<String>)?>(
    context: context,
    builder: (context) => _TagPickerModal(excludedTagIds: excludeTagIds),
  );
}

class _TagPickerModal extends HookConsumerWidget {
  final Set<String>? excludedTagIds;

  const _TagPickerModal({this.excludedTagIds});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedTagIds = useState<Set<String>>({});
    final newTagValues = useState<Set<String>>({});

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
            "cancel",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: () => context.pop((selectedTagIds.value, newTagValues.value)),
          child: Text(
            "action_common_update",
            style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
          ).tr(),
        ),
      ],
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        height: MediaQuery.of(context).size.height * 0.6,
        child: TagPicker(
          onSelectExistingTag: onSelectExistingTag,
          filter: selectedTagIds.value,
          onSelectNewTag: onSelectNewTag,
          excludedTagIds: excludedTagIds,
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
    this.excludedTagIds,
  });

  final Set<String> filter;
  final Set<String>? excludedTagIds;

  /// Callback when existing tags are selected/deselected.
  final Function(Iterable<Tag>) onSelectExistingTag;

  /// If not null, shows a tile to create a new tag with user's filter input.
  final Function(Set<String>)? onSelectNewTag;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formFocus = useFocusNode();
    final searchQuery = useState('');
    final tags = ref.watch(tagProvider);
    final selectedTagIds = useState<Set<String>>(filter);
    final borderRadius = const BorderRadius.all(Radius.circular(10));
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
            hintText: 'filter_tags'.tr(),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 0),
          child: Divider(color: context.colorScheme.surfaceContainerHighest, thickness: 1),
        ),
        Expanded(
          child: tags.widgetWhen(
            onData: (tags) {
              var includedTags = tags;
              if (excludedTagIds?.isNotEmpty ?? false) {
                includedTags = tags.where((t) => !excludedTagIds!.contains(t.id)).toSet();
              }
              final trimmedQuery = _trimSlashes(searchQuery.value);
              final queryResult = includedTags
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
                    // Create new tag tile
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 2.0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isCreateSelected ? context.primaryColor : context.primaryColor.withAlpha(25),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: ListTile(
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
                      ),
                    );
                  }
                  final tag = queryResult[index];
                  final isSelected = selectedTagIds.value.any((id) => id == tag.id);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? context.primaryColor : context.primaryColor.withAlpha(25),
                        borderRadius: borderRadius,
                      ),
                      child: ListTile(
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

  String _trimSlashes(String s) {
    return s.replaceAll(RegExp(r'^/+|/+$'), '');
  }
}
