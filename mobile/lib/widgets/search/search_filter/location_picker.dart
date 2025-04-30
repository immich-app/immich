import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/search_filter.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/common/dropdown.dart';
import 'package:openapi/api.dart';

class LocationPicker extends HookConsumerWidget {
  const LocationPicker({super.key, required this.onSelected, this.filter});

  final Function(Map<String, String?>) onSelected;
  final SearchLocationFilter? filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final countryTextController =
        useTextEditingController(text: filter?.country);
    final stateTextController = useTextEditingController(text: filter?.state);
    final cityTextController = useTextEditingController(text: filter?.city);

    final selectedCountry = useState<String?>(filter?.country);
    final selectedState = useState<String?>(filter?.state);
    final selectedCity = useState<String?>(filter?.city);

    final countries = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.country,
        locationCountry: selectedCountry.value,
        locationState: selectedState.value,
      ),
    );

    final states = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.state,
        locationCountry: selectedCountry.value,
        locationState: selectedState.value,
      ),
    );

    final cities = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.city,
        locationCountry: selectedCountry.value,
        locationState: selectedState.value,
      ),
    );

    return Column(
      children: [
        SearchDropdown(
          dropdownMenuEntries: switch (countries) {
            AsyncError() => [],
            AsyncData(:final value) => value
                .map(
                  (e) => DropdownMenuEntry(
                    value: e,
                    label: e,
                  ),
                )
                .toList(),
            _ => [],
          },
          label: const Text('country').tr(),
          controller: countryTextController,
          onSelected: (value) {
            if (value.toString() == selectedCountry.value) {
              return;
            }
            selectedCountry.value = value.toString();
            stateTextController.value = TextEditingValue.empty;
            cityTextController.value = TextEditingValue.empty;
            onSelected({
              'country': selectedCountry.value,
              'state': null,
              'city': null,
            });
          },
        ),
        const SizedBox(
          height: 16,
        ),
        SearchDropdown(
          dropdownMenuEntries: switch (states) {
            AsyncError() => [],
            AsyncData(:final value) => value
                .map(
                  (e) => DropdownMenuEntry(
                    value: e,
                    label: e,
                  ),
                )
                .toList(),
            _ => [],
          },
          label: const Text('state').tr(),
          controller: stateTextController,
          onSelected: (value) {
            if (value.toString() == selectedState.value) {
              return;
            }
            selectedState.value = value.toString();
            cityTextController.value = TextEditingValue.empty;
            onSelected({
              'country': selectedCountry.value,
              'state': selectedState.value,
              'city': null,
            });
          },
        ),
        const SizedBox(
          height: 16,
        ),
        SearchDropdown(
          dropdownMenuEntries: switch (cities) {
            AsyncError() => [],
            AsyncData(:final value) => value
                .map(
                  (e) => DropdownMenuEntry(
                    value: e,
                    label: e,
                  ),
                )
                .toList(),
            _ => [],
          },
          label: const Text('city').tr(),
          controller: cityTextController,
          onSelected: (value) {
            selectedCity.value = value.toString();
            onSelected({
              'country': selectedCountry.value,
              'state': selectedState.value,
              'city': selectedCity.value,
            });
          },
        ),
      ],
    );
  }
}
