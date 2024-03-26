import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/search_filter.provider.dart';
import 'package:openapi/api.dart';

class CameraPicker extends HookConsumerWidget {
  const CameraPicker({super.key, required this.onSelected});

  final Function(Map<String, String?>) onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMake = useState<String?>(null);
    final selectedModel = useState<String?>(null);

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
      shape: MaterialStatePropertyAll<OutlinedBorder>(
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
            label: const Text('Make'),
            inputDecorationTheme: inputDecorationTheme,
            menuStyle: menuStyle,
            leadingIcon: const Icon(Icons.photo_camera_rounded),
            trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
            selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
            onSelected: (value) {
              selectedMake.value = value.toString();
              onSelected({
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
            label: const Text('Model'),
            inputDecorationTheme: inputDecorationTheme,
            menuStyle: menuStyle,
            leadingIcon: const Icon(Icons.camera),
            trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
            selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
            onSelected: (value) {
              selectedModel.value = value.toString();
              onSelected({
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
