import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

enum DisplayOption {
  notInAlbum,
  favorite,
  archive,
}

class DisplayOptionPicker extends HookWidget {
  const DisplayOptionPicker({super.key, required this.onSelect});

  final Function(Map<DisplayOption, bool>) onSelect;

  @override
  Widget build(BuildContext context) {
    final options = useState<Map<DisplayOption, bool>>({
      DisplayOption.notInAlbum: false,
      DisplayOption.favorite: false,
      DisplayOption.archive: false,
    });

    return ListView(
      shrinkWrap: true,
      children: [
        CheckboxListTile(
          title: const Text('Not in album'),
          value: options.value[DisplayOption.notInAlbum],
          onChanged: (bool? value) {
            options.value = {
              ...options.value,
              DisplayOption.notInAlbum: value!,
            };
            onSelect(options.value);
          },
        ),
        CheckboxListTile(
          title: const Text('Favorite'),
          value: options.value[DisplayOption.favorite],
          onChanged: (value) {
            options.value = {
              ...options.value,
              DisplayOption.favorite: value!,
            };
            onSelect(options.value);
          },
        ),
        CheckboxListTile(
          title: const Text('Archive'),
          value: options.value[DisplayOption.archive],
          onChanged: (value) {
            options.value = {
              ...options.value,
              DisplayOption.archive: value!,
            };
            onSelect(options.value);
          },
        ),
      ],
    );
  }
}
