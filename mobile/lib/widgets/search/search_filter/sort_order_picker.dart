import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:openapi/api.dart' show AssetOrder;

enum _SortOption { bestMatch, newest, oldest }

class SortOrderPicker extends HookWidget {
  const SortOrderPicker({super.key, required this.onSelect, this.order});

  final Function(AssetOrder?) onSelect;
  final AssetOrder? order;

  @override
  Widget build(BuildContext context) {
    final selected = useState<_SortOption>(switch (order) {
      AssetOrder.desc => _SortOption.newest,
      AssetOrder.asc => _SortOption.oldest,
      _ => _SortOption.bestMatch,
    });

    return RadioGroup<_SortOption>(
      onChanged: (value) {
        if (value == null) return;
        selected.value = value;
        onSelect(switch (value) {
          _SortOption.bestMatch => null,
          _SortOption.newest => AssetOrder.desc,
          _SortOption.oldest => AssetOrder.asc,
        });
      },
      groupValue: selected.value,
      child: Column(
        children: [
          RadioListTile(title: const Text('best_match').tr(), value: _SortOption.bestMatch),
          RadioListTile(title: const Text('newest_first').tr(), value: _SortOption.newest),
          RadioListTile(title: const Text('oldest_first').tr(), value: _SortOption.oldest),
        ],
      ),
    );
  }
}
