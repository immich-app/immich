import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/entities/store.entity.dart' as storeKeys;
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SettingsHeader {
  String key = "";
  String value = "";
}

class HeaderSettings extends HookConsumerWidget {
  const HeaderSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final apiService = ref.watch(apiServiceProvider);
    final headers = useState<List<SettingsHeader>>([]);
    final setInitialHeaders = useState(false);

    var headersStr = storeKeys.Store.get(storeKeys.StoreKey.customHeaders, "");
    if (!setInitialHeaders.value) {
      if (headersStr.isNotEmpty) {
        var customHeaders = jsonDecode(headersStr) as Map;
        customHeaders.forEach((k, v) {
          var h = SettingsHeader();
          h.key = k;
          h.value = v;
          headers.value.add(h);
        });
      }

      // add first one to help the user
      if (headers.value.isEmpty) {
        var h = SettingsHeader();
        h.key = '';
        h.value = '';

        headers.value.add(h);
      }
    }
    setInitialHeaders.value = true;

    var list = [
      ...headers.value.map((h) {
        return HeaderKeyValueSettings(
          header: h,
          onRemove: () {
            headers.value.remove(h);
            headers.value = headers.value.toList();
          },
        );
      }),
    ];

    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
        title: const Text('Proxy Headers').tr(),
        actions: [
          IconButton(
            onPressed: () {
              headers.value.add(SettingsHeader());
              headers.value = headers.value.toList();
            },
            icon: const Icon(Icons.add_outlined),
            tooltip: 'Add Header',
          ),
        ],
      ),
      body: PopScope(
        onPopInvoked: (_) => save(headers.value),
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(vertical: 20),
          itemCount: list.length,
          itemBuilder: (ctx, index) => list[index],
          separatorBuilder: (context, index) => const SizedBox(height: 10),
        ),
      ),
    );
  }

  save(List<SettingsHeader> headers) {
    var headersMap = {};
    for (var h in headers) {
      var k = h.key.trim();
      var v = h.value.trim();

      if (k.isEmpty || v.isEmpty) continue;
      headersMap[k] = v;
    }

    var encoded = jsonEncode(headersMap);
    storeKeys.Store.put(storeKeys.StoreKey.customHeaders, encoded);
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
      return 'Value cannot be empty';
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    const buttonRadius = 25.0;

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
                    labelText: 'Header Name'.tr(),
                    border: const OutlineInputBorder(),
                    hintText: 'Value of the header name'.tr(),
                  ),
                  autocorrect: false,
                  onChanged: (v) {
                    header.key = v;
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
                  color: Colors.red,
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
              labelText: 'Header Value'.tr(),
              border: const OutlineInputBorder(),
              hintText: 'Value of the header'.tr(),
            ),
            autocorrect: false,
            onChanged: (v) {
              header.value = v;
            },
            validator: emptyFieldValidator,
            textInputAction: TextInputAction.done,
          ),
        ),
      ],
    );
  }
}
