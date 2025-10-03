import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';

class SortTypePicker extends HookWidget {
  const SortTypePicker({super.key, required this.onSelect, this.filter});

  final Function(AlbumAssetOrder) onSelect;
  final AlbumAssetOrder? filter;

  @override
  Widget build(BuildContext context) {
    final selectedSortType = useState(filter ?? AlbumAssetOrder.desc);

    return ListView(
      shrinkWrap: true,
      children: [
        RadioListTile(
          key: const Key("desc"),
          title: const Text("search_descending").tr(),
          value: AlbumAssetOrder.desc,
          onChanged: (value) {
            selectedSortType.value = value!;
            onSelect(value);
          },
          groupValue: selectedSortType.value,
        ),
        RadioListTile(
          key: const Key("asc"),
          title: const Text("search_ascending").tr(),
          value: AlbumAssetOrder.asc,
          onChanged: (value) {
            selectedSortType.value = value!;
            onSelect(value);
          },
          groupValue: selectedSortType.value,
        ),
      ],
    );
  }
}
