import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/services/localization.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

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
    final filteredLocaleEntries =
        useState<List<MapEntry<String, Locale>>>(localeEntries);
    final selectedLocale = useState<Locale>(currentLocale);

    final isLoading = useState<bool>(false);
    final isButtonDisabled =
        selectedLocale.value == currentLocale || isLoading.value;

    final searchController = useTextEditingController();
    final searchFocusNode = useFocusNode();
    final debounceTimer = useRef<Timer?>(null);

    void onSearch(String searchTerm) {
      debounceTimer.value?.cancel();
      debounceTimer.value = Timer(const Duration(milliseconds: 500), () {
        if (searchTerm.isEmpty) {
          filteredLocaleEntries.value = localeEntries;
        } else {
          filteredLocaleEntries.value = localeEntries
              .where(
                (entry) =>
                    entry.key.toLowerCase().contains(searchTerm.toLowerCase()),
              )
              .toList();
        }
      });
    }

    void clearSearch() {
      searchController.clear();
      onSearch('');
    }

    useEffect(
      () {
        void searchListener() => onSearch(searchController.text);
        searchController.addListener(searchListener);
        return () {
          searchController.removeListener(searchListener);
          debounceTimer.value?.cancel();
        };
      },
      [searchController],
    );

    return SafeArea(
      child: Column(
        children: [
          _LanguageSearchBar(
            controller: searchController,
            focusNode: searchFocusNode,
            onClear: clearSearch,
            onChanged: (_) => onSearch(searchController.text),
          ),
          Expanded(
            child: filteredLocaleEntries.value.isEmpty
                ? const _LanguageNotFound()
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: filteredLocaleEntries.value.length,
                    itemExtent: 64.0,
                    itemBuilder: (context, index) {
                      final countryName =
                          filteredLocaleEntries.value[index].key;
                      final localeValue =
                          filteredLocaleEntries.value[index].value;
                      final bool isSelected =
                          selectedLocale.value == localeValue;

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
          if (filteredLocaleEntries.value.isNotEmpty)
            _LanguageApplyButton(
              isDisabled: isButtonDisabled,
              isLoading: isLoading.value,
              onPressed: () => _applyLanguageChange(
                context,
                selectedLocale,
                isLoading,
              ),
            ),
        ],
      ),
    );
  }
}

class _LanguageSearchBar extends StatelessWidget {
  const _LanguageSearchBar({
    required this.controller,
    required this.focusNode,
    required this.onClear,
    required this.onChanged,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onClear;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 16, bottom: 8, left: 50, right: 50),
      decoration: BoxDecoration(
        color: context.colorScheme.surface,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(Radius.circular(24)),
          gradient: LinearGradient(
            colors: [
              context.colorScheme.primary.withValues(alpha: 0.075),
              context.colorScheme.primary.withValues(alpha: 0.09),
              context.colorScheme.primary.withValues(alpha: 0.075),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SearchField(
          autofocus: false,
          contentPadding: const EdgeInsets.all(12),
          hintText: context.t('language_search_hint'),
          prefixIcon: const Icon(Icons.search_rounded),
          suffixIcon: controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded),
                  onPressed: onClear,
                )
              : null,
          controller: controller,
          onChanged: onChanged,
          focusNode: focusNode,
          onTapOutside: (_) => focusNode.unfocus(),
        ),
      ),
    );
  }
}

class _LanguageNotFound extends StatelessWidget {
  const _LanguageNotFound();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off_rounded,
            size: 64,
            color: context.colorScheme.onSurface.withValues(alpha: 0.4),
          ),
          const SizedBox(height: 8),
          Text(
            context.t('language_no_results_title'),
            style: context.textTheme.titleMedium?.copyWith(
              color: context.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            context.t('language_no_results_subtitle'),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurface.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguageApplyButton extends StatelessWidget {
  const _LanguageApplyButton({
    required this.isDisabled,
    required this.isLoading,
    required this.onPressed,
  });

  final bool isDisabled;
  final bool isLoading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: context.colorScheme.surface,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: isDisabled ? null : onPressed,
            child: isLoading
                ? const SizedBox.square(
                    dimension: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    context.t('setting_languages_apply'),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16.0,
                    ),
                  ),
          ),
        ),
      ),
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
