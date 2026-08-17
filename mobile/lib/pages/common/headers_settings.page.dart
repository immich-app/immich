import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

class SettingsHeader {
  String key = "";
  String value = "";
}

@RoutePage()
class HeaderSettingsPage extends HookConsumerWidget {
  const HeaderSettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final headers = useState<List<SettingsHeader>>([]);
    final setInitialHeaders = useState(false);

    final storedHeaders = ref.watch(appConfigProvider.select((s) => s.network.customHeaders));
    if (!setInitialHeaders.value) {
      storedHeaders.forEach((k, v) {
        final header = SettingsHeader();
        header.key = k;
        header.value = v;
        headers.value.add(header);
      });

      // add first one to help the user
      if (headers.value.isEmpty) {
        final header = SettingsHeader();
        header.key = '';
        header.value = '';

        headers.value.add(header);
      }
    }
    setInitialHeaders.value = true;

    final list = [
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
        title: Text(context.t.headers_settings_tile_title),
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () {
              headers.value.add(SettingsHeader());
              headers.value = headers.value.toList();
            },
            icon: const Icon(Icons.add_outlined),
            tooltip: context.t.header_settings_add_header_tip,
          ),
        ],
      ),
      body: PopScope(
        onPopInvokedWithResult: (didPop, _) => saveHeaders(ref, headers.value),
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 16.0),
          itemCount: list.length,
          itemBuilder: (ctx, index) => list[index],
          separatorBuilder: (context, index) =>
              const Padding(padding: EdgeInsets.only(bottom: 16.0, left: 8, right: 8), child: Divider()),
        ),
      ),
    );
  }

  Future<void> saveHeaders(WidgetRef ref, List<SettingsHeader> headers) async {
    final headersMap = <String, String>{};
    for (final header in headers) {
      final key = header.key.trim();
      final value = header.value.trim();

      if (key.isEmpty || value.isEmpty) {
        continue;
      }
      headersMap[key] = value;
    }

    final apiService = ref.read(apiServiceProvider);
    await ref.read(settingsProvider).write(.networkCustomHeaders, headersMap);
    await apiService.updateHeaders();
  }
}

class HeaderKeyValueSettings extends StatelessWidget {
  final TextEditingController keyController;
  final TextEditingController valueController;
  final SettingsHeader header;
  final Function() onRemove;

  HeaderKeyValueSettings({super.key, required this.header, required this.onRemove})
    : keyController = TextEditingController(text: header.key),
      valueController = TextEditingController(text: header.value);

  String? emptyFieldValidator(String? value) {
    if (value == null || value.isEmpty) {
      return StaticTranslations.instance.header_settings_field_validator_msg;
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
                    labelText: context.t.header_settings_header_name_input,
                    border: const OutlineInputBorder(),
                  ),
                  autocorrect: false,
                  smartDashesType: .disabled,
                  smartQuotesType: .disabled,
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
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
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
              labelText: context.t.header_settings_header_value_input,
              border: const OutlineInputBorder(),
            ),
            autocorrect: false,
            smartDashesType: .disabled,
            smartQuotesType: .disabled,
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
