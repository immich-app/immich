import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_viewer_settings/asset_viewer_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/backup_settings.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/beta_sync_settings.dart';
import 'package:immich_mobile/widgets/settings/beta_timeline_list_tile.dart';
import 'package:immich_mobile/widgets/settings/language_settings.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';
import 'package:immich_mobile/widgets/settings/notification_setting.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/preference_setting.dart';
import 'package:immich_mobile/widgets/settings/settings_card.dart';

enum SettingSection {
  beta(
    'beta_sync',
    Icons.sync_outlined,
    "beta_sync_subtitle",
  ),
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
    'backup',
    Icons.cloud_upload_outlined,
    "backup_setting_subtitle",
  ),
  languages(
    'language',
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
        SettingSection.beta => const _BetaLandscapeToggle(),
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
      body: context.isMobile ? const _MobileLayout() : const _TabletLayout(),
    );
  }
}

class _MobileLayout extends StatelessWidget {
  const _MobileLayout();
  @override
  Widget build(BuildContext context) {
    final List<Widget> settings = SettingSection.values
        .expand(
          (setting) => setting == SettingSection.beta
              ? [
                  const BetaTimelineListTile(),
                  if (Store.isBetaTimelineEnabled)
                    SettingsCard(
                      icon: Icons.sync_outlined,
                      title: 'beta_sync'.tr(),
                      subtitle: 'beta_sync_subtitle'.tr(),
                      settingRoute: const BetaSyncSettingsRoute(),
                    ),
                ]
              : [
                  SettingsCard(
                    title: setting.title.tr(),
                    subtitle: setting.subtitle.tr(),
                    icon: setting.icon,
                    settingRoute: SettingsSubRoute(section: setting),
                  ),
                ],
        )
        .toList();
    return ListView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.only(top: 10.0, bottom: 56),
      children: [...settings],
    );
  }
}

class _TabletLayout extends HookWidget {
  const _TabletLayout();
  @override
  Widget build(BuildContext context) {
    final selectedSection = useState<SettingSection>(SettingSection.values.first);

    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: CustomScrollView(
            slivers: [
              ...SettingSection.values.map(
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
              ),
            ],
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

class _BetaLandscapeToggle extends HookWidget {
  const _BetaLandscapeToggle();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        const SizedBox(height: 100, child: BetaTimelineListTile()),
        if (Store.isBetaTimelineEnabled) const Expanded(child: BetaSyncSettings()),
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
