import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';

class MediaTypePicker extends HookWidget {
  const MediaTypePicker({super.key, required this.onSelect, this.filter});

  final Function(AssetType) onSelect;
  final AssetType? filter;

  @override
  Widget build(BuildContext context) {
    final selectedMediaType = useState(filter ?? AssetType.other);

    return RadioGroup(
      onChanged: (value) {
        selectedMediaType.value = value!;
        onSelect(value);
      },
      groupValue: selectedMediaType.value,
      child: Column(
        children: [
          RadioListTile(key: const Key("all"), title: Text(context.t.all), value: AssetType.other),
          RadioListTile(key: const Key("image"), title: Text(context.t.image), value: AssetType.image),
          RadioListTile(key: const Key("video"), title: Text(context.t.video), value: AssetType.video),
        ],
      ),
    );
  }
}
