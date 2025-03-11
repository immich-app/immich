import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/theme/color_scheme.dart';
import 'package:immich_mobile/theme/dynamic_theme.dart';

class PrimaryColorSetting extends HookConsumerWidget {
  const PrimaryColorSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeProvider = ref.read(immichThemeProvider);

    final primaryColorSetting =
        useAppSettingsState(AppSettingsEnum.primaryColor);
    final systemPrimaryColorSetting =
        useAppSettingsState(AppSettingsEnum.dynamicTheme);

    final currentPreset = useValueNotifier(ref.read(immichThemePresetProvider));
    const tileSize = 55.0;

    useValueChanged(
      primaryColorSetting.value,
      (_, __) => currentPreset.value = ImmichColorPreset.values
          .firstWhere((e) => e.name == primaryColorSetting.value),
    );

    void popBottomSheet() {
      Future.delayed(const Duration(milliseconds: 200), () {
        Navigator.pop(context);
      });
    }

    onUseSystemColorChange(bool newValue) {
      systemPrimaryColorSetting.value = newValue;
      ref.watch(dynamicThemeSettingProvider.notifier).state = newValue;
      ref.invalidate(immichThemeProvider);
      popBottomSheet();
    }

    onPrimaryColorChange(ImmichColorPreset colorPreset) {
      primaryColorSetting.value = colorPreset.name;
      ref.watch(immichThemePresetProvider.notifier).state = colorPreset;
      ref.invalidate(immichThemeProvider);

      //turn off system color setting
      if (systemPrimaryColorSetting.value) {
        onUseSystemColorChange(false);
      } else {
        popBottomSheet();
      }
    }

    buildPrimaryColorTile({
      required Color topColor,
      required Color bottomColor,
      required double tileSize,
      required bool showSelector,
    }) {
      return Container(
        margin: const EdgeInsets.all(4.0),
        child: Stack(
          children: [
            Container(
              height: tileSize,
              width: tileSize,
              decoration: BoxDecoration(
                color: bottomColor,
                borderRadius: const BorderRadius.all(Radius.circular(100)),
              ),
            ),
            Container(
              height: tileSize / 2,
              width: tileSize,
              decoration: BoxDecoration(
                color: topColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(100),
                  topRight: Radius.circular(100),
                ),
              ),
            ),
            if (showSelector)
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(100)),
                    color: Colors.grey[900]?.withValues(alpha: .4),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(3),
                    child: Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: 25,
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
    }

    bottomSheetContent() {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Align(
            alignment: Alignment.center,
            child: Text(
              "theme_setting_primary_color_title".tr(),
              style: context.textTheme.titleLarge,
            ),
          ),
          if (DynamicTheme.isAvailable)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              margin: const EdgeInsets.only(top: 10),
              child: SwitchListTile.adaptive(
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 6, horizontal: 20),
                dense: true,
                activeColor: context.primaryColor,
                tileColor: context.colorScheme.surfaceContainerHigh,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                title: Text(
                  'theme_setting_system_primary_color_title'.tr(),
                  style: context.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    height: 1.5,
                  ),
                ),
                value: systemPrimaryColorSetting.value,
                onChanged: onUseSystemColorChange,
              ),
            ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              children: ImmichColorPreset.values.map((preset) {
                final theme = preset.themeOfPreset;

                return GestureDetector(
                  onTap: () => onPrimaryColorChange(preset),
                  child: buildPrimaryColorTile(
                    topColor: theme.light.primary,
                    bottomColor: theme.dark.primary,
                    tileSize: tileSize,
                    showSelector: currentPreset.value == preset &&
                        !systemPrimaryColorSetting.value,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      );
    }

    return ListTile(
      onTap: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (BuildContext ctx) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 0),
            child: bottomSheetContent(),
          );
        },
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      title: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "theme_setting_primary_color_title".tr(),
                  style: context.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  "theme_setting_primary_color_subtitle".tr(),
                  style: context.textTheme.bodyMedium
                      ?.copyWith(color: context.colorScheme.onSurfaceSecondary),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 5.0, horizontal: 8.0),
            child: buildPrimaryColorTile(
              topColor: themeProvider.light.primary,
              bottomColor: themeProvider.dark.primary,
              tileSize: 42.0,
              showSelector: false,
            ),
          ),
        ],
      ),
    );
  }
}
