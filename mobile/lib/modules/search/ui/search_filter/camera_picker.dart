import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class CameraPicker extends HookConsumerWidget {
  const CameraPicker({super.key, required this.onSelected});

  final Function(Map<String, String?>) onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMake = useState<String?>(null);
    final selectedModel = useState<String?>(null);

    final make = [
      const DropdownMenuEntry(value: "Nikon", label: 'Nikon'),
      const DropdownMenuEntry(value: "Canon", label: 'Canon'),
      const DropdownMenuEntry(value: "Sony", label: 'Sony'),
      const DropdownMenuEntry(value: "Fujifilm", label: 'Fujifilm'),
      const DropdownMenuEntry(value: "Panasonic", label: 'Panasonic'),
      const DropdownMenuEntry(value: "Olympus", label: 'Olympus'),
    ];

    final models = [
      const DropdownMenuEntry(value: "D3500", label: "D3500"),
      const DropdownMenuEntry(value: "D5600", label: "D5600"),
      const DropdownMenuEntry(value: "D7500", label: "D7500"),
      const DropdownMenuEntry(value: "D780", label: "D780"),
      const DropdownMenuEntry(value: "D850", label: "D850"),
      const DropdownMenuEntry(value: "D6", label: "D6"),
    ];

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
            dropdownMenuEntries: make,
            width: context.width * 0.45,
            menuHeight: 400,
            initialSelection: make.first,
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
            dropdownMenuEntries: models,
            width: context.width * 0.45,
            menuHeight: 400,
            initialSelection: models.first,
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
