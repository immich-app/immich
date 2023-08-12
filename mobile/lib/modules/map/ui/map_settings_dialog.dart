import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_settings.provider.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class MapSettingsDialog extends HookConsumerWidget {
  const MapSettingsDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsServiceProvider);
    final mapSettings = ref.watch(mapSettingsStateNotifier.notifier);
    final isDarkMode = useState(AppSettingsEnum.mapThemeMode.defaultValue);
    final showFavoriteOnly =
        useState(AppSettingsEnum.mapShowFavoriteOnly.defaultValue);
    final ThemeData theme = Theme.of(context);

    useEffect(
      () {
        isDarkMode.value = settings.getSetting(AppSettingsEnum.mapThemeMode);
        showFavoriteOnly.value =
            settings.getSetting(AppSettingsEnum.mapShowFavoriteOnly);
        return null;
      },
      [settings],
    );

    Widget buildMapThemeSetting() {
      return SwitchListTile.adaptive(
        value: isDarkMode.value,
        onChanged: (value) {
          isDarkMode.value = value;
        },
        activeColor: Theme.of(context).primaryColor,
        dense: true,
        title: Text(
          "Allow dark mode".tr(),
          style: Theme.of(context)
              .textTheme
              .labelLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildFavoriteOnlySetting() {
      return SwitchListTile.adaptive(
        value: showFavoriteOnly.value,
        onChanged: (value) {
          showFavoriteOnly.value = value;
        },
        activeColor: Theme.of(context).primaryColor,
        dense: true,
        title: Text(
          "Show Favorite Only".tr(),
          style: Theme.of(context)
              .textTheme
              .labelLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    List<Widget> getDialogActions() {
      return <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(
            backgroundColor: Colors.white,
          ),
          child: const Text(
            "Cancel",
            style: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        TextButton(
          onPressed: () {
            settings.setSetting(AppSettingsEnum.mapThemeMode, isDarkMode.value);
            settings.setSetting(
              AppSettingsEnum.mapShowFavoriteOnly,
              showFavoriteOnly.value,
            );
            mapSettings.switchTheme(isDarkMode.value);
            mapSettings.switchFavoriteOnly(showFavoriteOnly.value);
            Navigator.of(context).pop();
          },
          style: TextButton.styleFrom(
            backgroundColor: theme.primaryColor,
          ),
          child: const Text(
            "Save",
            style: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
        )
      ];
    }

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: Center(
        child: Text(
          "Map Settings",
          style: TextStyle(
            color: theme.primaryColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.6,
          ),
          child: ListView(
            shrinkWrap: true,
            children: [
              ...ListTile.divideTiles(
                context: context,
                tiles: [
                  buildMapThemeSetting(),
                  buildFavoriteOnlySetting(),
                ],
              ).toList(),
            ],
          ),
        ),
      ),
      actions: getDialogActions(),
      actionsAlignment: MainAxisAlignment.spaceEvenly,
    );
  }
}
