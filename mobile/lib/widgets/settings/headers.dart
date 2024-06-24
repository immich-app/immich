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
  HeaderSettings({super.key});

  var setInitialHeaders = false;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiService = ref.watch(apiServiceProvider);
    final headers = useState<List<SettingsHeader>>([]);

    var headersStr = storeKeys.Store.get(storeKeys.StoreKey.customHeaders, "");
    if (!setInitialHeaders && headersStr.isNotEmpty) {
      var customHeaders = jsonDecode(headersStr) as Map;
      customHeaders.forEach((k, v) {
        var h = SettingsHeader();
        h.key = k;
        h.value = v;
        headers.value.add(h);
      });
    }
    setInitialHeaders = true;

    const buttonRadius = 25.0;
    return SettingsSubPageScaffold(settings: [
      ...headers.value.map((h) {
        return HeaderKeyValueSettings(
          header: h,
          onRemove: () {
            headers.value.remove(h);
            headers.value = headers.value.toList();
          },
        );
      }),
      Padding(
        padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(buttonRadius)),
            ),
          ),
          onPressed: () {
            // setState(() {
            headers.value.add(SettingsHeader());
            headers.value = headers.value.toList();
            // });
          },
          icon: const Icon(Icons.add_outlined),
          label: const Text(
            'add request header',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ),
      Padding(
        padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(buttonRadius)),
                ),
          ),
          onPressed: () {
            var headersMap = {};
            headers.value.forEach((h) {
              headersMap[h.key] = h.value;
            });

            var encoded = jsonEncode(headersMap);
            storeKeys.Store.put(storeKeys.StoreKey.customHeaders, encoded);
          },
          icon: const Icon(Icons.arrow_forward_rounded),
          label: const Text(
            'Save Headers',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ),
    ]);
  }
}

class HeaderKeyValueSettings extends StatelessWidget {
  final TextEditingController keyController;
  final TextEditingController valueController;
  final SettingsHeader header;
  final Function() onRemove;

  HeaderKeyValueSettings(
      {super.key, required this.header, required this.onRemove})
      : keyController = TextEditingController(text: header.key),
        valueController = TextEditingController(text: header.value);

  @override
  Widget build(BuildContext context) {
    const buttonRadius = 25.0;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
          child: TextFormField(
            controller: keyController,
            decoration: InputDecoration(
              labelText: 'Header Name'.tr(),
              border: const OutlineInputBorder(),
              hintText: 'key_hint'.tr(),
            ),
            autocorrect: false,
            onChanged: (v) {
              header.key = v;
            },
            // onFieldSubmitted: (_) => onSubmit?.call(),
            textInputAction: TextInputAction.next,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
          child: TextFormField(
            controller: valueController,
            decoration: InputDecoration(
              labelText: 'Header Value'.tr(),
              border: const OutlineInputBorder(),
              hintText: 'value_hint'.tr(),
            ),
            autocorrect: false,
            onChanged: (v) {
              header.value = v;
            },
            // onFieldSubmitted: (_) => onSubmit?.call(),
            textInputAction: TextInputAction.done,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(buttonRadius)),
              ),
            ),
            onPressed: onRemove,
            icon: const Icon(Icons.delete_outline),
            label: const Text(
              'remove header',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ).tr(),
          ),
        ),
      ],
    );
  }
}
