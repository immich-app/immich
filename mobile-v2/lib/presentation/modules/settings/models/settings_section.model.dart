import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:material_symbols_icons/symbols.dart';

enum SettingSection {
  general._(
    labelKey: 'settings.sections.general',
    icon: Symbols.interests_rounded,
    destination: GeneralSettingsRoute(),
  ),
  advance._(
    labelKey: 'settings.sections.advance',
    icon: Symbols.build_rounded,
    destination: AdvanceSettingsRoute(),
  ),
  about._(
    labelKey: 'settings.sections.about',
    icon: Symbols.help_rounded,
    destination: AboutSettingsRoute(),
  );

  final PageRouteInfo destination;
  final String labelKey;
  final IconData icon;

  const SettingSection._({
    required this.labelKey,
    required this.icon,
    required this.destination,
  });
}
