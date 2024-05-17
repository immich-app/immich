import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/search_filter.provider.dart';
import 'package:openapi/api.dart';

class CameraPicker extends HookConsumerWidget {
  const CameraPicker({super.key, required this.onSelect, this.filter});

  final Function(Map<String, String?>) onSelect;
  final SearchCameraFilter? filter;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final makeTextController = useTextEditingController(text: filter?.make);
    final modelTextController = useTextEditingController(text: filter?.model);
    final selectedMake = useState<String?>(filter?.make);
    final selectedModel = useState<String?>(filter?.model);

    final make = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.cameraMake,
      ),
    );

    final models = ref.watch(
      getSearchSuggestionsProvider(
        SearchSuggestionType.cameraModel,
        make: selectedMake.value,
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

    return Container(
      padding: const EdgeInsets.only(
          // bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          DropdownMenu(
            dropdownMenuEntries: switch (make) {
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
            width: context.width * 0.45,
            menuHeight: 400,
            label: const Text('search_filter_camera_make').tr(),
            inputDecorationTheme: inputDecorationTheme,
            controller: makeTextController,
            menuStyle: menuStyle,
            leadingIcon: const Icon(Icons.photo_camera_rounded),
            trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
            selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
            onSelected: (value) {
              selectedMake.value = value.toString();
              onSelect({
                'make': selectedMake.value,
                'model': selectedModel.value,
              });
            },
          ),
          DropdownMenu(
            dropdownMenuEntries: switch (models) {
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
            width: context.width * 0.45,
            menuHeight: 400,
            label: const Text('search_filter_camera_model').tr(),
            inputDecorationTheme: inputDecorationTheme,
            controller: modelTextController,
            menuStyle: menuStyle,
            leadingIcon: const Icon(Icons.camera),
            trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
            selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
            onSelected: (value) {
              selectedModel.value = value.toString();
              onSelect({
                'make': selectedMake.value,
                'model': selectedModel.value,
              });
            },
          ),
        ],
      ),
    );
  }
}
