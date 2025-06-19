import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_viewer_settings/asset_viewer_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/backup_settings.dart';
import 'package:immich_mobile/widgets/settings/core/setting_card.dart';
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
        title: Text('settings', style: context.pageTitle).tr(),
      ),
      body: context.isMobile ? const _MobileLayout() : const _TabletLayout(),
    );
  }
}

class _MobileLayout extends StatelessWidget {
  const _MobileLayout();
  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      children: [
        ...SettingSection.values.map(
          (section) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _MobileSettingsItem(section: section),
          ),
        ),
      ],
    );
  }
}

class _TabletLayout extends HookWidget {
  const _TabletLayout();

  @override
  Widget build(BuildContext context) {
    final selectedSection =
        useState<SettingSection>(SettingSection.values.first);

    return Row(
      children: [
        Expanded(
          flex: 2,
          child: ListView.builder(
            itemCount: SettingSection.values.length,
            itemBuilder: (context, index) {
              final section = SettingSection.values[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: _TabletSettingsItem(
                  section: section,
                  isSelected: section == selectedSection.value,
                  onTap: () => selectedSection.value = section,
                ),
              );
            },
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

class _MobileSettingsItem extends StatelessWidget {
  final SettingSection section;

  const _MobileSettingsItem({
    required this.section,
  });

  @override
  Widget build(BuildContext context) {
    return SettingCard(
      margin: EdgeInsets.zero,
      child: ListTile(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        leading: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(Radius.circular(12)),
            color: context.colorScheme.primary.withValues(alpha: 0.1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Icon(section.icon, color: context.primaryColor),
          ),
        ),
        title: Text(section.title).tr(),
        titleTextStyle: context.itemTitle,
        subtitle: Text(section.subtitle).tr(),
        subtitleTextStyle: context.itemSubtitle,
        trailing: Icon(
          Icons.chevron_right,
          color: context.colorScheme.onSurface.withValues(alpha: 0.4),
          size: 18,
        ),
        onTap: () => context.pushRoute(SettingsSubRoute(section: section)),
      ),
    );
  }
}

class _TabletSettingsItem extends StatelessWidget {
  const _TabletSettingsItem({
    required this.section,
    required this.isSelected,
    required this.onTap,
  });

  final SettingSection section;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
      title: Text(section.title).tr(),
      titleTextStyle: context.itemTitle.copyWith(
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
      ),
      leading: Icon(section.icon),
      selected: isSelected,
      selectedTileColor: context.primaryColor.withValues(alpha: 0.1),
      onTap: onTap,
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
        title: Text(section.title, style: context.pageTitle).tr(),
      ),
      body: section.widget,
    );
  }
}
