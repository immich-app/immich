import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/services/localization.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class LanguageSettings extends HookConsumerWidget {
  const LanguageSettings({super.key});

  Future<void> _applyLanguageChange(
    BuildContext context,
    ValueNotifier<Locale> selectedLocale,
    ValueNotifier<bool> isLoading,
  ) async {
    isLoading.value = true;
    await Future.delayed(const Duration(milliseconds: 500));
    try {
      await context.setLocale(selectedLocale.value);
      await loadTranslations();
    } finally {
      isLoading.value = false;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localeEntries = useMemoized(() => locales.entries.toList(), const []);
    final currentLocale = context.locale;
    final selectedLocale = useState<Locale>(currentLocale);
    final isLoading = useState<bool>(false);
    final isButtonDisabled =
        selectedLocale.value == currentLocale || isLoading.value;

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(
              vertical: 16.0,
              horizontal: 8.0,
            ),
            itemCount: localeEntries.length,
            itemExtent: 64.0,
            itemBuilder: (context, index) {
              final countryName = localeEntries[index].key;
              final localeValue = localeEntries[index].value;
              final bool isSelected = selectedLocale.value == localeValue;

              return _LanguageItem(
                countryName: countryName,
                localeValue: localeValue,
                isSelected: isSelected,
                onTap: () {
                  selectedLocale.value = localeValue;
                },
              );
            },
          ),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            color: context.colorScheme.surface,
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: isButtonDisabled
                    ? null
                    : () => _applyLanguageChange(
                          context,
                          selectedLocale,
                          isLoading,
                        ),
                child: isLoading.value
                    ? SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: context.colorScheme.onPrimary,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'setting_languages_apply'.tr(),
                        style: context.textTheme.titleSmall?.copyWith(
                          color: context.colorScheme.onPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _LanguageItem extends StatelessWidget {
  const _LanguageItem({
    required this.countryName,
    required this.localeValue,
    required this.isSelected,
    required this.onTap,
  });

  final String countryName;
  final Locale localeValue;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 4.0,
        horizontal: 8.0,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color:
              context.colorScheme.surfaceContainerLowest.withValues(alpha: .6),
          borderRadius: const BorderRadius.all(
            Radius.circular(16.0),
          ),
          border: Border.all(
            color: context.colorScheme.outlineVariant.withValues(alpha: .4),
            width: 1.0,
          ),
        ),
        child: ListTile(
          title: Text(
            countryName,
            style: context.textTheme.titleSmall?.copyWith(
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              color: isSelected
                  ? context.colorScheme.primary
                  : context.colorScheme.onSurfaceVariant,
            ),
          ),
          trailing: isSelected
              ? Icon(
                  Icons.check,
                  color: context.colorScheme.primary,
                  size: 20,
                )
              : null,
          onTap: onTap,
          selected: isSelected,
          selectedTileColor: context.colorScheme.primary.withValues(alpha: .15),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16.0)),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16.0,
          ),
        ),
      ),
    );
  }
}
