import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

enum DisplayOption {
  notInAlbum,
  favorite,
  archive,
}

class DisplayOptionPicker extends HookWidget {
  const DisplayOptionPicker({super.key, required this.onSelect});

  final Function(Set<DisplayOption>) onSelect;

  @override
  Widget build(BuildContext context) {
    final selectedDisplayOption = useState<Set<DisplayOption>>({});

    return ListView(
      shrinkWrap: true,
      children: [
        CheckboxListTile(
          title: const Text('Not in album'),
          value: selectedDisplayOption.value.contains(DisplayOption.notInAlbum),
          onChanged: (bool? value) {
            if (value != null && value) {
              selectedDisplayOption.value.add(DisplayOption.notInAlbum);
              selectedDisplayOption.value = selectedDisplayOption.value;
            } else {
              selectedDisplayOption.value.remove(DisplayOption.notInAlbum);
              selectedDisplayOption.value = selectedDisplayOption.value;
            }
            onSelect(selectedDisplayOption.value);
          },
        ),
        CheckboxListTile(
          title: const Text('Favorite'),
          value: selectedDisplayOption.value.contains(DisplayOption.favorite),
          onChanged: (value) {
            if (value != null && value) {
              selectedDisplayOption.value.add(DisplayOption.favorite);
              selectedDisplayOption.value = selectedDisplayOption.value;
            } else {
              selectedDisplayOption.value.remove(DisplayOption.favorite);
              selectedDisplayOption.value = selectedDisplayOption.value;
            }
            onSelect(selectedDisplayOption.value);
          },
        ),
        CheckboxListTile(
          title: const Text('Archive'),
          value: selectedDisplayOption.value.contains(DisplayOption.archive),
          onChanged: (value) {
            if (value != null && value) {
              selectedDisplayOption.value.add(DisplayOption.archive);
              selectedDisplayOption.value = selectedDisplayOption.value;
            } else {
              selectedDisplayOption.value.remove(DisplayOption.archive);
              selectedDisplayOption.value = selectedDisplayOption.value;
            }
            onSelect(selectedDisplayOption.value);
          },
        ),
      ],
    );
  }
}
