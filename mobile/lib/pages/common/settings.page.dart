import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/settings/advanced_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_viewer_settings/asset_viewer_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/backup_settings.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/sync_status_and_actions.dart';
import 'package:immich_mobile/widgets/settings/free_up_space_settings.dart';
import 'package:immich_mobile/widgets/settings/language_settings.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';
import 'package:immich_mobile/widgets/settings/notification_setting.dart';
import 'package:immich_mobile/widgets/settings/passkey_settings.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/preference_setting.dart';
import 'package:immich_ui/immich_ui.dart';

enum SettingSection {
  advanced(Icons.build_outlined),
  assetViewer(Icons.image_outlined),
  backup(Icons.cloud_upload_outlined),
  freeUpSpace(Icons.cleaning_services_outlined),
  languages(Icons.language),
  networking(Icons.wifi),
  notifications(Icons.notifications_none_rounded),
  passkeys(Icons.key_outlined),
  preferences(Icons.interests_outlined),
  timeline(Icons.auto_awesome_mosaic_outlined),
  beta(Icons.sync_outlined);

  final IconData icon;

  String title(Translations t) => switch (this) {
    SettingSection.advanced => t.advanced,
    SettingSection.assetViewer => t.asset_viewer_settings_title,
    SettingSection.backup => t.backup,
    SettingSection.freeUpSpace => t.free_up_space,
    SettingSection.languages => t.language,
    SettingSection.networking => t.networking_settings,
    SettingSection.notifications => t.notifications,
    SettingSection.passkeys => t.passkeys(count: 2),
    SettingSection.preferences => t.preferences_settings_title,
    SettingSection.timeline => t.asset_list_settings_title,
    SettingSection.beta => t.sync_status,
  };

  String subtitle(Translations t) => switch (this) {
    SettingSection.advanced => t.advanced_settings_tile_subtitle,
    SettingSection.assetViewer => t.asset_viewer_settings_subtitle,
    SettingSection.backup => t.backup_settings_subtitle,
    SettingSection.freeUpSpace => t.free_up_space_settings_subtitle,
    SettingSection.languages => t.setting_languages_subtitle,
    SettingSection.networking => t.networking_subtitle,
    SettingSection.notifications => t.setting_notifications_subtitle,
    SettingSection.passkeys => t.manage_your_passkeys,
    SettingSection.preferences => t.preferences_settings_subtitle,
    SettingSection.timeline => t.asset_list_settings_subtitle,
    SettingSection.beta => t.sync_status_subtitle,
  };

  Widget get widget => switch (this) {
    SettingSection.advanced => const AdvancedSettings(),
    SettingSection.assetViewer => const AssetViewerSettings(),
    SettingSection.backup => const BackupSettings(),
    SettingSection.freeUpSpace => const FreeUpSpaceSettings(),
    SettingSection.languages => const LanguageSettings(),
    SettingSection.networking => const NetworkingSettings(),
    SettingSection.notifications => const NotificationSetting(),
    SettingSection.passkeys => const PasskeySettings(),
    SettingSection.preferences => const PreferenceSetting(),
    SettingSection.timeline => const AssetListSettings(),
    SettingSection.beta => const SyncStatusAndActions(),
  };

  const SettingSection(this.icon);
}

@RoutePage()
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(centerTitle: false, title: Text(context.t.settings)),
      body: context.isMobile ? const _MobileLayout() : const _TabletLayout(),
    );
  }
}

class _MobileLayout extends ConsumerWidget {
  const _MobileLayout();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggedIn = ref.watch(authProvider).isAuthenticated;
    final isPasskeyEnabled = ref.watch(Store.passkeys.enabled()).valueOrNull ?? false;
    final List<Widget> settings = SettingSection.values
        .where((setting) => setting != SettingSection.passkeys || (isLoggedIn && isPasskeyEnabled))
        .expand(
          (setting) => setting == SettingSection.beta
              ? [
                  SettingsCard(
                    icon: Icons.sync_outlined,
                    title: context.t.sync_status,
                    subtitle: context.t.sync_status_subtitle,
                    onTap: () => context.pushRoute(const SyncStatusRoute()),
                  ),
                ]
              : [
                  SettingsCard(
                    title: setting.title(context.t),
                    subtitle: setting.subtitle(context.t),
                    icon: setting.icon,
                    onTap: () => context.pushRoute(SettingsSubRoute(section: setting)),
                  ),
                ],
        )
        .toList();
    settings.add(
      SettingsCard(
        icon: Icons.auto_awesome_outlined,
        title: context.t.whats_new,
        subtitle: context.t.whats_new_settings_subtitle,
        onTap: () => context.pushRoute(const WhatsNewRoute()),
      ),
    );
    return ListView(padding: const EdgeInsets.only(top: 10.0, bottom: 60), children: [...settings]);
  }
}

class _TabletLayout extends HookConsumerWidget {
  const _TabletLayout();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedSection = useState<SettingSection>(SettingSection.values.first);
    final isLoggedIn = ref.watch(authProvider).isAuthenticated;
    final isPasskeyEnabled = ref.watch(Store.passkeys.enabled()).valueOrNull ?? false;
    final sections = SettingSection.values.where(
      (s) => s != SettingSection.passkeys || (isLoggedIn && isPasskeyEnabled),
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: CustomScrollView(
            slivers: [
              ...sections.map(
                (s) => SliverToBoxAdapter(
                  child: ListTile(
                    title: Text(s.title(context.t)),
                    leading: Icon(s.icon),
                    selected: s.index == selectedSection.value.index,
                    selectedColor: context.primaryColor,
                    selectedTileColor: context.themeData.highlightColor,
                    onTap: () => selectedSection.value = s,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: ListTile(
                  title: Text(context.t.whats_new),
                  leading: const Icon(Icons.auto_awesome_outlined),
                  onTap: () => context.pushRoute(const WhatsNewRoute()),
                ),
              ),
            ],
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(flex: 4, child: selectedSection.value.widget),
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
      appBar: AppBar(centerTitle: false, title: Text(section.title(context.t))),
      body: section.widget,
    );
  }
}
