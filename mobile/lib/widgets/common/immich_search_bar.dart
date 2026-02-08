import 'dart:math';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/widgets/search/search_filter/people_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

class ImmichSearchBar extends HookWidget {
  final ValueChanged<String> onSubmitted;
  final Function(Set<PersonDto>)? onPeopleSubmitted;
  final String? hintText;
  final bool autofocus;

  const ImmichSearchBar({
    super.key,
    required this.onSubmitted,
    this.onPeopleSubmitted,
    this.hintText,
    this.autofocus = false,
  });

  @override
  Widget build(BuildContext context) {
    final searchController = useTextEditingController();
    final focusNode = useFocusNode();
    final selectedPeople = useState<Set<PersonDto>>({});

    void showPeopleFilter() {
      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: HookBuilder(
            builder: (context) {
              return FilterBottomSheetScaffold(
                title: 'search_filter_people_title'.tr(),
                expanded: true,
                onSearch: () {
                  if (onPeopleSubmitted != null) {
                    onPeopleSubmitted!(selectedPeople.value);
                  }
                  // No need for Navigator.pop here, FilterBottomSheetScaffold does it
                },
                onClear: () {
                  selectedPeople.value = {};
                  if (onPeopleSubmitted != null) {
                    onPeopleSubmitted!({});
                  }
                },
                child: PeoplePicker(
                  filter: selectedPeople.value,
                  onSelect: (people) {
                    selectedPeople.value = people;
                  },
                ),
              );
            },
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: context.colorScheme.onSurface.withAlpha(0), width: 0),
          borderRadius: const BorderRadius.all(Radius.circular(24)),
          gradient: LinearGradient(
            colors: [
              context.colorScheme.primary.withValues(alpha: 0.075),
              context.colorScheme.primary.withValues(alpha: 0.09),
              context.colorScheme.primary.withValues(alpha: 0.075),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            transform: const GradientRotation(0.5 * pi),
          ),
        ),
        child: SearchField(
          autofocus: autofocus,
          contentPadding: const EdgeInsets.all(16),
          hintText: hintText ?? 'search_bar_hint'.tr(),
          prefixIcon: IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () => onSubmitted(searchController.text),
            tooltip: 'Search',
          ),
          suffixIcon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (onPeopleSubmitted != null)
                IconButton(
                  icon: const Icon(Icons.person_search_rounded),
                  onPressed: showPeopleFilter,
                  tooltip: 'filter_people'.tr(),
                ),
              if (searchController.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear_rounded),
                  onPressed: () {
                    searchController.clear();
                  },
                ),
            ],
          ),
          controller: searchController,
          onSubmitted: onSubmitted,
          focusNode: focusNode,
          onTapOutside: (_) => focusNode.unfocus(),
          onChanged: (value) {
            // Trigger rebuild for clear button visibility
          },
        ),
      ),
    );
  }
}
