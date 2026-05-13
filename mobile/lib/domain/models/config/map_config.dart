import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/option.dart';

class MapConfig {
  final int relativeDays;
  final bool favoritesOnly;
  final bool includeArchived;
  final ThemeMode themeMode;
  final bool withPartners;
  final Option<DateTime> customFrom;
  final Option<DateTime> customTo;

  const MapConfig({
    this.relativeDays = 0,
    this.favoritesOnly = false,
    this.includeArchived = false,
    this.themeMode = ThemeMode.system,
    this.withPartners = false,
    this.customFrom = const Option.none(),
    this.customTo = const Option.none(),
  });

  MapConfig copyWith({
    int? relativeDays,
    bool? favoritesOnly,
    bool? includeArchived,
    ThemeMode? themeMode,
    bool? withPartners,
    Option<DateTime>? customFrom,
    Option<DateTime>? customTo,
  }) => MapConfig(
    relativeDays: relativeDays ?? this.relativeDays,
    favoritesOnly: favoritesOnly ?? this.favoritesOnly,
    includeArchived: includeArchived ?? this.includeArchived,
    themeMode: themeMode ?? this.themeMode,
    withPartners: withPartners ?? this.withPartners,
    customFrom: customFrom ?? this.customFrom,
    customTo: customTo ?? this.customTo,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MapConfig &&
          other.relativeDays == relativeDays &&
          other.favoritesOnly == favoritesOnly &&
          other.includeArchived == includeArchived &&
          other.themeMode == themeMode &&
          other.withPartners == withPartners &&
          other.customFrom == customFrom &&
          other.customTo == customTo);

  @override
  int get hashCode =>
      Object.hash(relativeDays, favoritesOnly, includeArchived, themeMode, withPartners, customFrom, customTo);

  @override
  String toString() =>
      'MapConfig(relativeDays: $relativeDays, favoritesOnly: $favoritesOnly, includeArchived: $includeArchived, themeMode: $themeMode, withPartners: $withPartners, customFrom: $customFrom, customTo: $customTo)';
}
