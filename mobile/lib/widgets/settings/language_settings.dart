import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/localization.service.dart';

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
        LayoutBuilder(
          builder: (context, constraints) {
            return DropdownMenu(
              width: constraints.maxWidth,
              inputDecorationTheme: InputDecorationTheme(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                contentPadding: const EdgeInsets.only(left: 16),
              ),
              menuStyle: MenuStyle(
                shape: WidgetStatePropertyAll<OutlinedBorder>(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
                backgroundColor: WidgetStatePropertyAll<Color>(
                  context.isDarkTheme
                      ? Colors.grey[900]!
                      : context.scaffoldBackgroundColor,
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
            );
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
