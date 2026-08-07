import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';

class StorageStatusPicker extends HookWidget {
  const StorageStatusPicker({super.key, required this.onSelect, required this.filter});

  final Function(SearchStorageStatus) onSelect;
  final SearchStorageStatus filter;

  @override
  Widget build(BuildContext context) {
    final currentOption = useState<SearchStorageStatus>(filter);

    void handleSelect(SearchStorageStatus? value) {
      if (value == null) return;
      currentOption.value = value;
      onSelect(value);
    }

    return ListView(
      shrinkWrap: true,
      children: [
        RadioListTile<SearchStorageStatus>(
          title: Text('all'.t(context: context)),
          value: SearchStorageStatus.all,
          groupValue: currentOption.value,
          onChanged: handleSelect,
        ),
        RadioListTile<SearchStorageStatus>(
          title: Text('search_filter_storage_not_backed_up'.t(context: context)),
          value: SearchStorageStatus.notBackedUp,
          groupValue: currentOption.value,
          onChanged: handleSelect,
        ),
        RadioListTile<SearchStorageStatus>(
          title: Text('search_filter_storage_server_only'.t(context: context)),
          value: SearchStorageStatus.serverOnly,
          groupValue: currentOption.value,
          onChanged: handleSelect,
        ),
      ],
    );
  }
}
