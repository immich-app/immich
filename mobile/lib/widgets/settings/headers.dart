import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SettingsHeader {
  String key = "";
  String value = "";
}

class HeaderSettings extends HookConsumerWidget {
  final List<SettingsHeader> headers = [SettingsHeader()];

  HeaderSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiService = ref.watch(apiServiceProvider);

    const buttonRadius = 25.0;
    return SettingsSubPageScaffold(settings: [
      ...headers.map((h) {
        return HeaderKeyValueSettings(header: h);
      }),
      Padding(
        padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(buttonRadius))),
          ),
          onPressed: () {
            // setState(() {
              headers.add(SettingsHeader());
            // });
          },
          icon: const Icon(Icons.arrow_forward_rounded),
          label: const Text(
            'add header',
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
                borderRadius: BorderRadius.all(Radius.circular(buttonRadius))),
          ),
          onPressed: () {
            var headers = {};
            this.headers.forEach((h) {
              headers[h.key] = h.value;
            });

            var encoded = jsonEncode(headers);
            print(encoded);
            Store.put(StoreKey.customHeaders, encoded);
          },
          icon: const Icon(Icons.arrow_forward_rounded),
          label: const Text(
            'set headers',
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

  HeaderKeyValueSettings({super.key, required this.header})
      : keyController = TextEditingController(text: header.key),
        valueController = TextEditingController(text: header.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, top: 16.0),
          child: TextFormField(
            controller: keyController,
            decoration: InputDecoration(
              labelText: 'key'.tr(),
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
              labelText: 'value'.tr(),
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
      ],
    );
  }
}
