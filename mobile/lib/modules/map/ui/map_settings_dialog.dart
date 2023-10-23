import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';

class MapSettingsDialog extends HookConsumerWidget {
  const MapSettingsDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapSettingsNotifier = ref.read(mapStateNotifier.notifier);
    final mapSettings = ref.read(mapStateNotifier);
    final isDarkMode = useState(mapSettings.isDarkTheme);
    final showFavoriteOnly = useState(mapSettings.showFavoriteOnly);
    final showIncludeArchived = useState(mapSettings.includeArchived);
    final showRelativeDate = useState(mapSettings.relativeTime);
    final ThemeData theme = Theme.of(context);

    Widget buildMapThemeSetting() {
      return SwitchListTile.adaptive(
        value: isDarkMode.value,
        onChanged: (value) {
          isDarkMode.value = value;
        },
        activeColor: theme.primaryColor,
        dense: true,
        title: Text(
          "map_settings_dark_mode".tr(),
          style:
              theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildFavoriteOnlySetting() {
      return SwitchListTile.adaptive(
        value: showFavoriteOnly.value,
        onChanged: (value) {
          showFavoriteOnly.value = value;
        },
        activeColor: theme.primaryColor,
        dense: true,
        title: Text(
          "map_settings_only_show_favorites".tr(),
          style:
              theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildIncludeArchivedSetting() {
      return SwitchListTile.adaptive(
        value: showIncludeArchived.value,
        onChanged: (value) {
          showIncludeArchived.value = value;
        },
        activeColor: theme.primaryColor,
        dense: true,
        title: Text(
          "map_settings_include_show_archived".tr(),
          style:
              theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildDateRangeSetting() {
      final now = DateTime.now();
      return DropdownMenu(
        enableSearch: false,
        enableFilter: false,
        initialSelection: showRelativeDate.value,
        onSelected: (value) {
          showRelativeDate.value = value!;
        },
        dropdownMenuEntries: [
          const DropdownMenuEntry(value: 0, label: "All"),
          const DropdownMenuEntry(
            value: 1,
            label: "Past 24 hours",
          ),
          const DropdownMenuEntry(
            value: 7,
            label: "Past 7 days",
          ),
          const DropdownMenuEntry(
            value: 30,
            label: "Past 30 days",
          ),
          DropdownMenuEntry(
            value: now
                .difference(
                  DateTime(
                    now.year - 1,
                    now.month,
                    now.day,
                    now.hour,
                    now.minute,
                    now.second,
                  ),
                )
                .inDays,
            label: "Past year",
          ),
          DropdownMenuEntry(
            value: now
                .difference(
                  DateTime(
                    now.year - 3,
                    now.month,
                    now.day,
                    now.hour,
                    now.minute,
                    now.second,
                  ),
                )
                .inDays,
            label: "Past 3 years",
          ),
        ],
      );
    }

    List<Widget> getDialogActions() {
      return <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(
            backgroundColor:
                mapSettings.isDarkTheme ? Colors.grey[100] : Colors.grey[700],
          ),
          child: Text(
            "map_settings_dialog_cancel".tr(),
            style: theme.textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color:
                  mapSettings.isDarkTheme ? Colors.grey[900] : Colors.grey[100],
            ),
          ),
        ),
        TextButton(
          onPressed: () {
            mapSettingsNotifier.switchTheme(isDarkMode.value);
            mapSettingsNotifier.switchFavoriteOnly(showFavoriteOnly.value);
            mapSettingsNotifier.setRelativeTime(showRelativeDate.value);
            mapSettingsNotifier
                .switchIncludeArchived(showIncludeArchived.value);
            Navigator.of(context).pop();
          },
          style: TextButton.styleFrom(
            backgroundColor: theme.primaryColor,
          ),
          child: Text(
            "map_settings_dialog_save".tr(),
            style: theme.textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.primaryTextTheme.labelLarge?.color,
            ),
          ),
        ),
      ];
    }

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: Center(
        child: Text(
          "map_settings_dialog_title".tr(),
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
              buildMapThemeSetting(),
              buildFavoriteOnlySetting(),
              buildIncludeArchivedSetting(),
              const SizedBox(
                height: 10,
              ),
              Padding(
                padding: const EdgeInsets.only(left: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "map_settings_only_relative_range".tr(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    buildDateRangeSetting(),
                  ],
                ),
              ),
            ].toList(),
          ),
        ),
      ),
      actions: getDialogActions(),
      actionsAlignment: MainAxisAlignment.spaceEvenly,
    );
  }
}
