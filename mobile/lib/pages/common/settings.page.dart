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
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';
import 'package:immich_mobile/widgets/settings/notification_setting.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/preference_setting.dart';
import 'package:immich_mobile/routing/router.dart';

enum SettingSection {
  advanced(
    'advanced',
    Icons.build_outlined,
    "advanced_settings_tile_subtitle",
  ),
  assetViewer(
    'asset_viewer_settings_title',
    Icons.image_outlined,
    "asset_viewer_settings_subtitle",
  ),
  backup(
    'backup_controller_page_backup',
    Icons.cloud_upload_outlined,
    "backup_setting_subtitle",
  ),
  languages(
    'setting_languages_title',
    Icons.language,
    "setting_languages_subtitle",
  ),
  networking(
    'networking_settings',
    Icons.wifi,
    "networking_subtitle",
  ),
  notifications(
    'notifications',
    Icons.notifications_none_rounded,
    "setting_notifications_subtitle",
  ),
  preferences(
    'preferences_settings_title',
    Icons.interests_outlined,
    "preferences_settings_subtitle",
  ),
  timeline(
    'asset_list_settings_title',
    Icons.auto_awesome_mosaic_outlined,
    "asset_list_settings_subtitle",
  );

  final String title;
  final String subtitle;
  final IconData icon;

  Widget get widget => switch (this) {
        SettingSection.advanced => const AdvancedSettings(),
        SettingSection.assetViewer => const AssetViewerSettings(),
        SettingSection.backup => const BackupSettings(),
        SettingSection.languages => const LanguageSettings(),
        SettingSection.networking => const NetworkingSettings(),
        SettingSection.notifications => const NotificationSetting(),
        SettingSection.preferences => const PreferenceSetting(),
        SettingSection.timeline => const AssetListSettings(),
      };

  const SettingSection(this.title, this.icon, this.subtitle);
}

@RoutePage()
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    context.locale;
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: const Text('settings').tr(),
      ),
      body: context.isMobile ? _MobileLayout() : _TabletLayout(),
    );
  }
}

class _MobileLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      children: SettingSection.values
          .map(
            (setting) => Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16.0,
              ),
              child: Card(
                elevation: 0,
                clipBehavior: Clip.antiAlias,
                color: context.colorScheme.surfaceContainer,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                ),
                margin: const EdgeInsets.symmetric(vertical: 4.0),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                  ),
                  leading: Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.all(Radius.circular(16)),
                      color: context.isDarkTheme
                          ? Colors.black26
                          : Colors.white.withAlpha(100),
                    ),
                    padding: const EdgeInsets.all(16.0),
                    child: Icon(setting.icon, color: context.primaryColor),
                  ),
                  title: Text(
                    setting.title,
                    style: context.textTheme.titleMedium!.copyWith(
                      fontWeight: FontWeight.w600,
                      color: context.primaryColor,
                    ),
                  ).tr(),
                  subtitle: Text(
                    setting.subtitle,
                    style: context.textTheme.labelLarge,
                  ).tr(),
                  onTap: () =>
                      context.pushRoute(SettingsSubRoute(section: setting)),
                ),
              ),
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
                      selectedTileColor: context.themeData.highlightColor,
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
    context.locale;
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: Text(section.title).tr(),
      ),
      body: section.widget,
    );
  }
}
