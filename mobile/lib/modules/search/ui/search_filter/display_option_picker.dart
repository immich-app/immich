import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';

enum DisplayOption {
  notInAlbum,
  favorite,
  archive,
}

class DisplayOptionPicker extends HookWidget {
  const DisplayOptionPicker({
    super.key,
    required this.onSelect,
    this.filter,
  });

  final Function(Map<DisplayOption, bool>) onSelect;
  final SearchDisplayFilters? filter;

  @override
  Widget build(BuildContext context) {
    final options = useState<Map<DisplayOption, bool>>({
      DisplayOption.notInAlbum: filter?.isNotInAlbum ?? false,
      DisplayOption.favorite: filter?.isFavorite ?? false,
      DisplayOption.archive: filter?.isArchive ?? false,
    });

    return ListView(
      shrinkWrap: true,
      children: [
        CheckboxListTile(
          title: const Text('search_filter_display_option_not_in_album').tr(),
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
          title: const Text('search_filter_display_option_favorite').tr(),
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
          title: const Text('search_filter_display_option_archive').tr(),
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
