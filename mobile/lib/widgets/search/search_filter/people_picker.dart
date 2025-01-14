import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class PeoplePicker extends HookConsumerWidget {
  const PeoplePicker({super.key, required this.onSelect, this.filter});

  final Function(Set<Person>) onSelect;
  final Set<Person>? filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var imageSize = 45.0;
    final people = ref.watch(getAllPeopleProvider);
    final headers = ApiService.getRequestHeaders();
    final selectedPeople = useState<Set<Person>>(filter ?? {});

    return people.widgetWhen(
      onData: (people) {
        return ListView.builder(
          shrinkWrap: true,
          itemCount: people.length,
          padding: const EdgeInsets.all(8),
          itemBuilder: (context, index) {
            final person = people[index];
            return Card(
              elevation: 0,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(15)),
              ),
              child: ListTile(
                title: Text(
                  person.name,
                  style: context.textTheme.bodyLarge,
                ),
                leading: SizedBox(
                  height: imageSize,
                  child: Material(
                    shape: const CircleBorder(side: BorderSide.none),
                    elevation: 3,
                    child: CircleAvatar(
                      maxRadius: imageSize / 2,
                      backgroundImage: NetworkImage(
                        getFaceThumbnailUrl(person.id),
                        headers: headers,
                      ),
                    ),
                  ),
                ),
                onTap: () {
                  if (selectedPeople.value.contains(person)) {
                    selectedPeople.value.remove(person);
                  } else {
                    selectedPeople.value.add(person);
                  }

                  selectedPeople.value = {...selectedPeople.value};
                  onSelect(selectedPeople.value);
                },
                selected: selectedPeople.value.contains(person),
                selectedTileColor: context.primaryColor.withOpacity(0.2),
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(15)),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
