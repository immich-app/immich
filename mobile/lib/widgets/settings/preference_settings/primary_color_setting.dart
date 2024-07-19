import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class PrimaryColorSetting extends HookConsumerWidget {
  const PrimaryColorSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primaryColorSetting =
        useAppSettingsState(AppSettingsEnum.primaryColor);
    final currentColor = useValueNotifier(ref.read(immichPrimaryColorProvider));
    const tileSize = 46.0;
    const tileRadius = 6.0;
    const checkBoxSize = 23.0;

    useValueChanged(
      primaryColorSetting.value,
      (_, __) => currentColor.value = ImmichColorMode.values
          .firstWhere((e) => e.name == primaryColorSetting.value),
    );

    onPrimaryColorChange(ImmichColorMode colorType) {
      Navigator.of(context, rootNavigator: true).pop('dialog');
      primaryColorSetting.value = colorType.name;
      ref.watch(immichPrimaryColorProvider.notifier).state = colorType;
      ref.invalidate(immichThemeDataProvider);
    }

    buildPrimaryColorTile(
        ImmichColorMode colorType, bool isDummy, double tileSize) {
      return Container(
        height: tileSize,
        decoration: BoxDecoration(
          color: colorType.getColor(true),
          borderRadius: const BorderRadius.all(
            Radius.circular(tileRadius),
          ),
        ),
        margin: const EdgeInsets.symmetric(vertical: 4.0),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: tileSize,
              height: tileSize / 2,
              decoration: BoxDecoration(
                color: colorType.getColor(false),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(tileRadius),
                  topRight: Radius.circular(tileRadius),
                ),
              ),
            ),
            if (currentColor.value == colorType && !isDummy)
              Positioned(
                top: tileSize / 2 - checkBoxSize / 2,
                left: tileSize / 2 - checkBoxSize / 2,
                child: Container(
                  width: checkBoxSize,
                  height: checkBoxSize,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(
                      Radius.circular(6),
                    ),
                    color: Colors.grey[900]?.withOpacity(.6),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(3),
                    child: Icon(
                      Icons.check,
                      color: Colors.white,
                      size: checkBoxSize - 6,
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
    }

    showColorPickerDialog() {
      showDialog(
        context: context,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: Text("theme_setting_primary_color_title".tr()),
            content: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 350,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Wrap(
                    spacing: 8.0,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: ImmichColorMode.values.map((colorType) {
                      return GestureDetector(
                        onTap: () => onPrimaryColorChange(colorType),
                        child:
                            buildPrimaryColorTile(colorType, false, tileSize),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }

    return ListTile(
      onTap: showColorPickerDialog,
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
                    height: 1.5,
                  ),
                ),
                Text(
                  "theme_setting_primary_color_summary".tr(),
                  style: context.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 5.0, horizontal: 8.0),
            child: buildPrimaryColorTile(currentColor.value, true, 40.0),
          ),
        ],
      ),
    );
  }
}
