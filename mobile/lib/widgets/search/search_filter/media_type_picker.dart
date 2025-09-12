import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class MediaTypePicker extends HookWidget {
  const MediaTypePicker({super.key, required this.onSelect, this.filter});

  final Function(AssetType) onSelect;
  final AssetType? filter;

  @override
  Widget build(BuildContext context) {
    final selectedMediaType = useState(filter ?? AssetType.other);

    return Column(
      children: [
        RadioListTile<AssetType>(
          key: const Key("all"),
          title: const Text("all").tr(),
          value: AssetType.other,
          groupValue: selectedMediaType.value,
          onChanged: (value) {
            if (value != null) {
              selectedMediaType.value = value;
              onSelect(value);
            }
          },
        ),
        RadioListTile<AssetType>(
          key: const Key("image"),
          title: const Text("image").tr(),
          value: AssetType.image,
          groupValue: selectedMediaType.value,
          onChanged: (value) {
            if (value != null) {
              selectedMediaType.value = value;
              onSelect(value);
            }
          },
        ),
        RadioListTile<AssetType>(
          key: const Key("video"),
          title: const Text("video").tr(),
          value: AssetType.video,
          groupValue: selectedMediaType.value,
          onChanged: (value) {
            if (value != null) {
              selectedMediaType.value = value;
              onSelect(value);
            }
          },
        ),
      ],
    );
  }
}
