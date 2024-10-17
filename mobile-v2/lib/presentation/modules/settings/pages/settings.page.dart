import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_appbar.widget.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_wrapper.widget.dart';
import 'package:immich_mobile/presentation/modules/settings/models/settings_section.model.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

@RoutePage()
class SettingsWrapperPage extends StatelessWidget {
  const SettingsWrapperPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ImAdaptiveRouteWrapper(
      primaryBody: (_) => const SettingsPage(),
      primaryRoute: SettingsRoute.name,
      bodyRatio: 0.3,
    );
  }
}

@RoutePage()
// ignore: prefer-single-widget-per-file
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ImAdaptiveRoutePrimaryAppBar(),
      body: ListView.builder(
        itemCount: SettingSection.values.length,
        itemBuilder: (_, index) {
          final section = SettingSection.values.elementAt(index);
          return ListTile(
            title: Text(context.t[section.labelKey]),
            onTap: () => context.navigateRoot(section.destination),
            leading: Icon(section.icon),
          );
        },
      ),
    );
  }
}
