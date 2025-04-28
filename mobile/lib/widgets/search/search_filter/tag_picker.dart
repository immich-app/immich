import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/search_filter.provider.dart';
import 'package:immich_mobile/providers/tags.provider.dart';
import 'package:immich_mobile/providers/search/search_page_state.provider.dart';
import 'package:immich_mobile/widgets/common/dropdown_search_menu.dart';
import 'package:immich_mobile/widgets/search/search_filter/common/dropdown.dart';
import 'package:openapi/api.dart';

class TagPicker extends HookConsumerWidget {
  const TagPicker({super.key, required this.onSelected, this.filter});

  final Function(SearchTagsFilter) onSelected;
  final SearchTagsFilter? filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTags = ref.watch(getAllTagsProvider);
    final displayState =
        useState<List<TagResponseDto>>(filter?.selectedTags ?? []);

    void removeTagFromList(TagResponseDto? selection) {
      if (selection != null) {
        var selectedTags = filter?.selectedTags ?? [];
        filter?.selectedTags = [...selectedTags..remove(selection)];
        displayState.value = filter?.selectedTags ?? [];
        if (filter != null) this.onSelected(filter!);
      }
    }

    void addTagToSelection(TagResponseDto? selection) {
      var selectedTags = filter?.selectedTags ?? [];
      if (selection != null && !selectedTags.contains(selection)) {
        filter?.selectedTags = [...selectedTags..add(selection)];
        displayState.value = filter?.selectedTags ?? [];
        if (filter != null) this.onSelected(filter!);
      }
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        DropdownSearchMenu(
          trailingIcon: Icon(
            Icons.arrow_drop_down,
            color: context.primaryColor,
          ),
          hintText: "search_tags".tr(),
          label: const Text('tag').tr(),
          textStyle: context.textTheme.bodyMedium,
          initialSelection: null,
          clearOnSelection: true,
          onSelected: addTagToSelection,
          dropdownMenuEntries: asyncTags
              .when<List<DropdownMenuEntry<TagResponseDto>>>(error: (er, er1) {
            return [];
          }, loading: () {
            return [];
          }, data: (tags) {
            return (tags ?? [])
                .map(
                  (tag) => DropdownMenuEntry<TagResponseDto>(
                    value: tag,
                    label: tag.value,
                    style: ButtonStyle(
                      textStyle: WidgetStatePropertyAll(
                        context.textTheme.bodyMedium,
                      ),
                    ),
                  ),
                )
                .toList();
          }),
        ),
        Wrap(
          spacing: 1,
          runSpacing: 1,
          children: <ActionChip>[
            for (var tag in filter?.selectedTags ?? [])
              ActionChip(
                  label: Text(tag.value),
                  onPressed: () => removeTagFromList(tag),
                  shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.all(Radius.circular(20)))),
          ],
        ),
      ],
    );
  }
}
