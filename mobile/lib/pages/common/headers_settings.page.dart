import 'dart:convert';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/entities/store.entity.dart' as store_keys;
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SettingsHeader {
  String key = "";
  String value = "";
}

@RoutePage()
class HeaderSettingsPage extends HookConsumerWidget {
  const HeaderSettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final apiService = ref.watch(apiServiceProvider);
    final headers = useState<List<SettingsHeader>>([]);
    final setInitialHeaders = useState(false);

    var headersStr =
        store_keys.Store.get(store_keys.StoreKey.customHeaders, "");
    if (!setInitialHeaders.value) {
      if (headersStr.isNotEmpty) {
        var customHeaders = jsonDecode(headersStr) as Map;
        customHeaders.forEach((k, v) {
          final header = SettingsHeader();
          header.key = k;
          header.value = v;
          headers.value.add(header);
        });
      }

      // add first one to help the user
      if (headers.value.isEmpty) {
        final header = SettingsHeader();
        header.key = '';
        header.value = '';

        headers.value.add(header);
      }
    }
    setInitialHeaders.value = true;

    var list = [
      ...headers.value.map((headerValue) {
        return HeaderKeyValueSettings(
          header: headerValue,
          onRemove: () {
            headers.value.remove(headerValue);
            headers.value = headers.value.toList();
          },
        );
      }),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('header_settings_page_title').tr(),
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () {
              headers.value.add(SettingsHeader());
              headers.value = headers.value.toList();
            },
            icon: const Icon(Icons.add_outlined),
            tooltip: 'header_settings_add_header_tip'.tr(),
          ),
        ],
      ),
      body: PopScope(
        onPopInvoked: (_) => saveHeaders(headers.value),
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 16.0),
          itemCount: list.length,
          itemBuilder: (ctx, index) => list[index],
          separatorBuilder: (context, index) => const Padding(
            padding: EdgeInsets.only(bottom: 16.0, left: 8, right: 8),
            child: Divider(),
          ),
        ),
      ),
    );
  }

  saveHeaders(List<SettingsHeader> headers) {
    final headersMap = {};
    for (var header in headers) {
      final key = header.key.trim();
      final value = header.value.trim();

      if (key.isEmpty || value.isEmpty) continue;
      headersMap[key] = value;
    }

    var encoded = jsonEncode(headersMap);
    store_keys.Store.put(store_keys.StoreKey.customHeaders, encoded);
  }
}

class HeaderKeyValueSettings extends StatelessWidget {
  final TextEditingController keyController;
  final TextEditingController valueController;
  final SettingsHeader header;
  final Function() onRemove;

  HeaderKeyValueSettings({
    super.key,
    required this.header,
    required this.onRemove,
  })  : keyController = TextEditingController(text: header.key),
        valueController = TextEditingController(text: header.value);

  String? emptyFieldValidator(String? value) {
    if (value == null || value.isEmpty) {
      return 'header_settings_field_validator_msg'.tr();
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, bottom: 12.0),
          child: Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: keyController,
                  decoration: InputDecoration(
                    labelText: 'header_settings_header_name_input'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                  autocorrect: false,
                  onChanged: (headerKey) {
                    header.key = headerKey;
                  },
                  validator: emptyFieldValidator,
                  textInputAction: TextInputAction.next,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: IconButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  color: Colors.red[400],
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, bottom: 12.0),
          child: TextFormField(
            controller: valueController,
            decoration: InputDecoration(
              labelText: 'header_settings_header_value_input'.tr(),
              border: const OutlineInputBorder(),
            ),
            autocorrect: false,
            onChanged: (headerValue) {
              header.value = headerValue;
            },
            validator: emptyFieldValidator,
            textInputAction: TextInputAction.done,
          ),
        ),
      ],
    );
  }
}
