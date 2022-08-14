import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/ui/image_viewer_quality_setting/image_viewer_quality_setting.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';

class SettingsPage extends HookConsumerWidget {
  const SettingsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          iconSize: 20,
          splashRadius: 24,
          onPressed: () {
            Navigator.pop(context);
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        automaticallyImplyLeading: false,
        centerTitle: false,
        title: const Text(
          'Settings',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        children: [
          ...ListTile.divideTiles(
            context: context,
            tiles: [
              const ImageViewerQualitySetting(),
              SwitchListTile.adaptive(
                title: const Text('Light Theme'),
                value: ref.watch(appThemeProvider) == ThemeMode.light,
                onChanged: (value) => {
                  ref.watch(appThemeProvider.notifier).state =
                      value ? ThemeMode.light : ThemeMode.dark,
                },
              ),
              const SettingListTile(
                title: 'Theme',
                subtitle: 'Choose between light and dark theme',
              ),
            ],
          ).toList(),
        ],
      ),
    );
  }
}

class SettingListTile extends StatelessWidget {
  const SettingListTile({
    required this.title,
    required this.subtitle,
    Key? key,
  }) : super(key: key);

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          fontSize: 12,
        ),
      ),
      trailing: const Icon(
        Icons.keyboard_arrow_right_rounded,
        size: 24,
      ),
      onTap: () {},
    );
  }
}
