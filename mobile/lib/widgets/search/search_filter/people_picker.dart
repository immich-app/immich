import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/people/person_tile.widget.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

class PeoplePicker extends HookConsumerWidget {
  const PeoplePicker({super.key, required this.onSelect, this.filter});

  final Function(Set<PersonDto>) onSelect;
  final Set<PersonDto>? filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formFocus = useFocusNode();

    final searchQuery = useState('');
    final people = ref.watch(getAllPeopleProvider);
    final selectedPeople = useState<Set<PersonDto>>(filter ?? {});

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: SearchField(
            focusNode: formFocus,
            onChanged: (value) => searchQuery.value = value,
            onTapOutside: (_) => formFocus.unfocus(),
            filled: true,
            hintText: 'filter_people'.tr(),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 0),
          child: Divider(color: context.colorScheme.surfaceContainerHighest, thickness: 1),
        ),
        Expanded(
          child: people.widgetWhen(
            onData: (people) {
              return ListView.builder(
                shrinkWrap: true,
                itemCount: people
                    .where((person) => person.name.toLowerCase().contains(searchQuery.value.toLowerCase()))
                    .length,
                padding: const EdgeInsets.all(8),
                itemBuilder: (context, index) {
                  final person = people
                      .where((person) => person.name.toLowerCase().contains(searchQuery.value.toLowerCase()))
                      .toList()[index];
                  final isSelected = selectedPeople.value.contains(person);

                  return PersonTile(
                    isSelected: isSelected,
                    personId: person.id,
                    personName: person.name,
                    onTap: () {
                      if (selectedPeople.value.contains(person)) {
                        selectedPeople.value.remove(person);
                      } else {
                        selectedPeople.value.add(person);
                      }
                      selectedPeople.value = {...selectedPeople.value};
                      onSelect(selectedPeople.value);
                    },
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
