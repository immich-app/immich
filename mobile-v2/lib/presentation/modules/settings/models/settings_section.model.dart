import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:material_symbols_icons/symbols.dart';

enum SettingSection {
  general(
    icon: Symbols.interests_rounded,
    labelKey: 'settings.sections.general',
    destination: GeneralSettingsRoute(),
  ),
  advance(
    icon: Symbols.build_rounded,
    labelKey: 'settings.sections.advance',
    destination: AdvanceSettingsRoute(),
  ),
  about(
    icon: Symbols.help_rounded,
    labelKey: 'settings.sections.about',
    destination: AboutSettingsRoute(),
  );

  final PageRouteInfo destination;
  final String labelKey;
  final IconData icon;

  const SettingSection({
    required this.labelKey,
    required this.icon,
    required this.destination,
  });
}
