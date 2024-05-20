import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/search_filter.provider.dart';
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

    final inputDecorationTheme = InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      contentPadding: const EdgeInsets.only(left: 16),
    );

    final menuStyle = MenuStyle(
      shape: WidgetStatePropertyAll<OutlinedBorder>(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
    );

    return Column(
      children: [
        DropdownMenu(
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
          menuHeight: 400,
          width: context.width * 0.9,
          label: const Text('search_filter_location_country').tr(),
          inputDecorationTheme: inputDecorationTheme,
          menuStyle: menuStyle,
          controller: countryTextController,
          trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
          selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
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
        DropdownMenu(
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
          menuHeight: 400,
          width: context.width * 0.9,
          label: const Text('search_filter_location_state').tr(),
          inputDecorationTheme: inputDecorationTheme,
          menuStyle: menuStyle,
          controller: stateTextController,
          trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
          selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
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
        DropdownMenu(
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
          menuHeight: 400,
          width: context.width * 0.9,
          label: const Text('search_filter_location_city').tr(),
          inputDecorationTheme: inputDecorationTheme,
          menuStyle: menuStyle,
          controller: cityTextController,
          trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
          selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
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
