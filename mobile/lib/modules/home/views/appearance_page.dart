import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';

// ScrollController scrollController = useScrollController();

// Switch(
//   value: isSwitched.value,
//   onChanged: (value) {
// isSwitched.value = !isSwitched.value;
// Hive.box(themeInfoBox).put(themeInfoKey, isSwitched.value);
//   },
//   activeTrackColor: Colors.lightGreenAccent,
//   activeColor: Colors.green,
// ),

class AppearancePage extends HookConsumerWidget {
  const AppearancePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var theme =
        useState(Hive.box(themeInfoBox).get(themeInfoKey) ?? ThemeMode.system);
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: const Text(
          "settings_page_apperance",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
        leading: GestureDetector(
          child: const Icon(
            Icons.arrow_back_ios,
          ),
          onTap: () {
            AutoRouter.of(context).pop();
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            CheckboxListTile(
              title: const Text(
                "settings_page_apperance_adaptive",
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
              onChanged: (value) {
                theme.value = ThemeMode.system;
                Hive.box(themeInfoBox).put(themeInfoKey, theme.value);
              },
              value: theme.value == ThemeMode.system,
            ),
            const Divider(),
            CheckboxListTile(
              title: const Text(
                "settings_page_apperance_light",
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
              onChanged: (value) {
                theme.value = ThemeMode.light;
                Hive.box(themeInfoBox).put(themeInfoKey, theme.value);
              },
              value: theme.value == ThemeMode.light,
            ),
            const Divider(),
            CheckboxListTile(
              title: const Text(
                "settings_page_apperance_dark",
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
              onChanged: (value) {
                theme.value = ThemeMode.dark;
                Hive.box(themeInfoBox).put(themeInfoKey, theme.value);
              },
              value: theme.value == ThemeMode.dark,
            ),
          ],
        ),
      ),
    );
  }
}
