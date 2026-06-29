import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/pages/settings/server_statistics.page.dart';
import 'package:immich_mobile/widgets/settings/settings_card.dart';

enum AdminSettingSection {
  serverStatistics('server_stats', Icons.bar_chart_outlined, 'total_usage');

  final String title;
  final String subtitle;
  final IconData icon;

  Widget get widget => switch (this) {
    AdminSettingSection.serverStatistics => const ServerStatisticsPage(),
  };

  const AdminSettingSection(this.title, this.icon, this.subtitle);
}

@RoutePage()
class AdminSettingsPage extends StatelessWidget {
  const AdminSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    context.locale;
    return Scaffold(
      appBar: AppBar(centerTitle: false, title: const Text('administration').tr()),
      body: const _AdminSettingsLayout(),
    );
  }
}

class _AdminSettingsLayout extends StatelessWidget {
  const _AdminSettingsLayout();

  @override
  Widget build(BuildContext context) {
    final List<Widget> settings = AdminSettingSection.values
        .map(
          (setting) => SettingsCard(
            title: setting.title.tr(),
            subtitle: setting.subtitle.tr(),
            icon: setting.icon,
            settingRoute: AdminSettingsSubRoute(section: setting),
          ),
        )
        .toList();

    return ListView(padding: const EdgeInsets.only(top: 10.0, bottom: 60), children: settings);
  }
}

@RoutePage()
class AdminSettingsSubPage extends StatelessWidget {
  const AdminSettingsSubPage(this.section, {super.key});

  final AdminSettingSection section;

  @override
  Widget build(BuildContext context) {
    context.locale;
    return Scaffold(
      appBar: AppBar(centerTitle: false, title: Text(section.title).tr()),
      body: section.widget,
    );
  }
}
