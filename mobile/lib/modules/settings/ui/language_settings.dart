import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/backup/background_service/localization.dart';

class LanguageSettings extends HookConsumerWidget {
  const LanguageSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = context.locale;
    final textController = useTextEditingController(
      text: locales.keys.firstWhere(
        (countryName) => locales[countryName] == currentLocale,
      ),
    );

    final selectedLocale = useState<Locale>(currentLocale);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        DropdownMenu(
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            contentPadding: const EdgeInsets.only(left: 16),
          ),
          menuStyle: MenuStyle(
            shape: MaterialStatePropertyAll<OutlinedBorder>(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
          menuHeight: context.height * 0.5,
          hintText: "Languages",
          label: const Text('Languages'),
          dropdownMenuEntries: locales.keys
              .map(
                (countryName) => DropdownMenuEntry(
                  value: locales[countryName],
                  label: countryName,
                ),
              )
              .toList(),
          controller: textController,
          onSelected: (value) {
            if (value != null) {
              selectedLocale.value = value;
            }
          },
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: selectedLocale.value == currentLocale
              ? null
              : () {
                  context.setLocale(selectedLocale.value);
                  loadTranslations();
                },
          child: const Text('setting_languages_apply').tr(),
        ),
      ],
    );
  }
}
