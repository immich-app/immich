import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

class TagPicker extends HookConsumerWidget {
  const TagPicker({super.key, required this.onSelect, required this.filter});

  final Function(Iterable<Tag>) onSelect;
  final Set<String> filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formFocus = useFocusNode();
    final searchQuery = useState('');
    final tags = ref.watch(tagServiceProvider);
    final selectedTagIds = useState<Set<String>>(filter);

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
              final queryResult = tags
                  .where((t) => t.value.toLowerCase().contains(searchQuery.value.toLowerCase()))
                  .toList();
              return ListView.builder(
                itemCount: queryResult.length,
                padding: const EdgeInsets.all(8),
                itemBuilder: (context, index) {
                  final tag = queryResult[index];
                  final isSelected = selectedTagIds.value.any((id) => id == tag.id);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? context.primaryColor : context.primaryColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(10),
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
                          onSelect(tags.where((t) => newSelected.contains(t.id)));
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
}
