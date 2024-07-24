import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_viewer_settings/asset_viewer_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/backup_settings.dart';
import 'package:immich_mobile/widgets/settings/language_settings.dart';
import 'package:immich_mobile/widgets/settings/notification_setting.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/preference_setting.dart';
import 'package:immich_mobile/routing/router.dart';

enum SettingSection {
  notifications(
    'setting_notifications_title',
    Icons.notifications_none_rounded,
  ),
  languages('setting_languages_title', Icons.language),
  preferences('preferences_settings_title', Icons.interests_outlined),
  backup('backup_controller_page_backup', Icons.cloud_upload_outlined),
  timeline('asset_list_settings_title', Icons.auto_awesome_mosaic_outlined),
  viewer('asset_viewer_settings_title', Icons.image_outlined),
  advanced('advanced_settings_tile_title', Icons.build_outlined);

  final String title;
  final IconData icon;

  Widget get widget => switch (this) {
        SettingSection.notifications => const NotificationSetting(),
        SettingSection.languages => const LanguageSettings(),
        SettingSection.preferences => const PreferenceSetting(),
        SettingSection.backup => const BackupSettings(),
        SettingSection.timeline => const AssetListSettings(),
        SettingSection.viewer => const AssetViewerSettings(),
        SettingSection.advanced => const AdvancedSettings(),
      };

  const SettingSection(this.title, this.icon);
}

@RoutePage()
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
        title: const Text('setting_pages_app_bar_settings').tr(),
      ),
      body: context.isMobile ? _MobileLayout() : _TabletLayout(),
    );
  }
}

class _MobileLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      children: SettingSection.values
          .map(
            (s) => ListTile(
              title: Text(
                s.title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
              leading: Icon(s.icon),
              onTap: () => context.pushRoute(SettingsSubRoute(section: s)),
            ),
          )
          .toList(),
    );
  }
}

class _TabletLayout extends HookWidget {
  @override
  Widget build(BuildContext context) {
    final selectedSection =
        useState<SettingSection>(SettingSection.values.first);

    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: CustomScrollView(
            slivers: SettingSection.values
                .map(
                  (s) => SliverToBoxAdapter(
                    child: ListTile(
                      title: Text(s.title).tr(),
                      leading: Icon(s.icon),
                      selected: s.index == selectedSection.value.index,
                      selectedColor: context.primaryColor,
                      selectedTileColor: context.primaryColor.withAlpha(50),
                      onTap: () => selectedSection.value = s,
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          flex: 4,
          child: selectedSection.value.widget,
        ),
      ],
    );
  }
}

@RoutePage()
class SettingsSubPage extends StatelessWidget {
  const SettingsSubPage(this.section, {super.key});

  final SettingSection section;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: Text(section.title).tr(),
      ),
      body: section.widget,
    );
  }
}
