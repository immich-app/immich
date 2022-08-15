import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/ui/image_viewer_quality_setting/image_viewer_quality_setting.dart';
import 'package:immich_mobile/modules/settings/ui/theme_setting/theme_setting.dart';

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
              const ThemeSetting(),
            ],
          ).toList(),
        ],
      ),
    );
  }
}
