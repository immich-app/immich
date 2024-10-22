import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_appbar.widget.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_wrapper.widget.dart';
import 'package:immich_mobile/presentation/modules/settings/models/settings_section.model.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

@RoutePage()
class SettingsWrapperPage extends StatelessWidget {
  const SettingsWrapperPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ImAdaptiveRouteWrapper(
      primaryRoute: SettingsRoute.name,
      primaryBody: (_) => const SettingsPage(),
      bodyRatio: RatioConstants.oneThird,
    );
  }
}

@RoutePage()
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ImAdaptiveRouteAppBar(isPrimary: true),
      body: ListView.builder(
        itemBuilder: (_, index) {
          final section = SettingSection.values.elementAt(index);
          return ListTile(
            leading: Icon(section.icon),
            title: Text(context.t[section.labelKey]),
            onTap: () => unawaited(context.navigateRoot(section.destination)),
          );
        },
        itemCount: SettingSection.values.length,
      ),
    );
  }
}
