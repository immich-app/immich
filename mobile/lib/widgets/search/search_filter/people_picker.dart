import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class PeoplePicker extends HookConsumerWidget {
  const PeoplePicker({super.key, required this.onSelect, this.filter});

  final Function(Set<Person>) onSelect;
  final Set<Person>? filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formFocus = useFocusNode();
    final imageSize = 60.0;
    final searchQuery = useState('');
    final people = ref.watch(getAllPeopleProvider);
    final headers = ApiService.getRequestHeaders();
    final selectedPeople = useState<Set<Person>>(filter ?? {});

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: TextField(
            focusNode: formFocus,
            onChanged: (value) => searchQuery.value = value,
            onTapOutside: (_) => formFocus.unfocus(),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.only(left: 24),
              filled: true,
              fillColor: context.primaryColor.withValues(alpha: 0.1),
              hintStyle: context.textTheme.bodyLarge?.copyWith(
                color: context.themeData.colorScheme.onSurfaceSecondary,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.surfaceContainerHighest,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.surfaceContainerHighest,
                ),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.surfaceContainerHighest,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.primary.withAlpha(150),
                ),
              ),
              prefixIcon: Icon(
                Icons.search_rounded,
                color: context.colorScheme.primary,
              ),
              hintText: 'search_filter_people_hint'.tr(),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 0),
          child: Divider(
            color: context.colorScheme.surfaceContainerHighest,
            thickness: 1,
          ),
        ),
        Expanded(
          child: people.widgetWhen(
            onData: (people) {
              return ListView.builder(
                shrinkWrap: true,
                itemCount: people
                    .where(
                      (person) => person.name
                          .toLowerCase()
                          .contains(searchQuery.value.toLowerCase()),
                    )
                    .length,
                padding: const EdgeInsets.all(8),
                itemBuilder: (context, index) {
                  final person = people
                      .where(
                        (person) => person.name
                            .toLowerCase()
                            .contains(searchQuery.value.toLowerCase()),
                      )
                      .toList()[index];
                  final isSelected = selectedPeople.value.contains(person);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2.0),
                    child: LargeLeadingTile(
                      title: Text(
                        person.name,
                        style: context.textTheme.bodyLarge?.copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w500,
                          color: isSelected
                              ? context.colorScheme.onPrimary
                              : context.colorScheme.onSurface,
                        ),
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
                      selected: isSelected,
                      selectedTileColor: context.primaryColor,
                      tileColor: context.primaryColor.withAlpha(25),
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
