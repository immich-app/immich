import "dart:async";

import "package:easy_localization/easy_localization.dart";
import "package:flutter/material.dart";
import "package:flutter_hooks/flutter_hooks.dart";
import "package:hooks_riverpod/hooks_riverpod.dart";
import "package:immich_mobile/models/search/search_filter.model.dart";
import "package:immich_mobile/providers/search/search_filter.provider.dart";
import "package:immich_mobile/widgets/search/search_filter/common/dropdown.dart";
import "package:openapi/api.dart";

/// Creates a debounced listener for fuzzy search on text input.
/// Returns a listener function that updates the query state after a delay.
VoidCallback _createDebouncedListener({
  required TextEditingController controller,
  required ValueNotifier<String?> query,
  required ValueNotifier<String?> selected,
  required ObjectRef<Timer?> debounceRef,
  required Duration delay,
}) {
  return () {
    debounceRef.value?.cancel();
    debounceRef.value = Timer(delay, () {
      final text = controller.text;
      if (text.isNotEmpty && text != selected.value) {
        query.value = text;
      } else if (text.isEmpty) {
        query.value = null;
      }
    });
  };
}

/// Converts async data to dropdown menu entries.
List<DropdownMenuEntry<String>> _buildMenuEntries(AsyncValue<List<String>> data) {
  return switch (data) {
    AsyncData(:final value) => value.map((e) => DropdownMenuEntry(value: e, label: e)).toList(),
    _ => <DropdownMenuEntry<String>>[],
  };
}

/// A widget for selecting location filters (country, state, city) with fuzzy search support.
class LocationPicker extends HookConsumerWidget {
  const LocationPicker({super.key, required this.onSelected, this.filter});

  final void Function(Map<String, String?>) onSelected;
  final SearchLocationFilter? filter;

  static const _debounceDelay = Duration(milliseconds: 300);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final countryController = useTextEditingController(text: filter?.country);
    final stateController = useTextEditingController(text: filter?.state);
    final cityController = useTextEditingController(text: filter?.city);

    final selectedCountry = useState<String?>(filter?.country);
    final selectedState = useState<String?>(filter?.state);
    final selectedCity = useState<String?>(filter?.city);

    final countryQuery = useState<String?>(null);
    final stateQuery = useState<String?>(null);
    final cityQuery = useState<String?>(null);

    final countryDebounce = useRef<Timer?>(null);
    final stateDebounce = useRef<Timer?>(null);
    final cityDebounce = useRef<Timer?>(null);

    // Setup debounced listeners for fuzzy search
    useEffect(() {
      final countryListener = _createDebouncedListener(
        controller: countryController,
        query: countryQuery,
        selected: selectedCountry,
        debounceRef: countryDebounce,
        delay: _debounceDelay,
      );
      final stateListener = _createDebouncedListener(
        controller: stateController,
        query: stateQuery,
        selected: selectedState,
        debounceRef: stateDebounce,
        delay: _debounceDelay,
      );
      final cityListener = _createDebouncedListener(
        controller: cityController,
        query: cityQuery,
        selected: selectedCity,
        debounceRef: cityDebounce,
        delay: _debounceDelay,
      );

      countryController.addListener(countryListener);
      stateController.addListener(stateListener);
      cityController.addListener(cityListener);

      return () {
        countryController.removeListener(countryListener);
        stateController.removeListener(stateListener);
        cityController.removeListener(cityListener);
        countryDebounce.value?.cancel();
        stateDebounce.value?.cancel();
        cityDebounce.value?.cancel();
      };
    }, [countryController, stateController, cityController]);

    final countries = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.country,
        locationCountry: selectedCountry.value,
        locationState: selectedState.value,
        query: countryQuery.value,
      ),
    );

    final states = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.state,
        locationCountry: selectedCountry.value,
        locationState: selectedState.value,
        query: stateQuery.value,
      ),
    );

    final cities = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.city,
        locationCountry: selectedCountry.value,
        locationState: selectedState.value,
        query: cityQuery.value,
      ),
    );

    return Column(
      children: [
        SearchDropdown(
          dropdownMenuEntries: _buildMenuEntries(countries),
          label: const Text("country").tr(),
          controller: countryController,
          onSelected: (value) {
            if (value.toString() == selectedCountry.value) return;
            selectedCountry.value = value.toString();
            countryQuery.value = null;
            stateController.value = TextEditingValue.empty;
            cityController.value = TextEditingValue.empty;
            onSelected({"country": selectedCountry.value, "state": null, "city": null});
          },
        ),
        const SizedBox(height: 16),
        SearchDropdown(
          dropdownMenuEntries: _buildMenuEntries(states),
          label: const Text("state").tr(),
          controller: stateController,
          onSelected: (value) {
            if (value.toString() == selectedState.value) return;
            selectedState.value = value.toString();
            stateQuery.value = null;
            cityController.value = TextEditingValue.empty;
            onSelected({"country": selectedCountry.value, "state": selectedState.value, "city": null});
          },
        ),
        const SizedBox(height: 16),
        SearchDropdown(
          dropdownMenuEntries: _buildMenuEntries(cities),
          label: const Text("city").tr(),
          controller: cityController,
          onSelected: (value) {
            selectedCity.value = value.toString();
            cityQuery.value = null;
            onSelected({"country": selectedCountry.value, "state": selectedState.value, "city": selectedCity.value});
          },
        ),
      ],
    );
  }
}
