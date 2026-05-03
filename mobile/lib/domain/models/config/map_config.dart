import 'package:flutter/material.dart';

class MapConfig {
  final int relativeDays;
  final bool favoritesOnly;
  final bool includeArchived;
  final ThemeMode themeMode;
  final bool withPartners;

  const MapConfig({
    this.relativeDays = 0,
    this.favoritesOnly = false,
    this.includeArchived = false,
    this.themeMode = ThemeMode.system,
    this.withPartners = false,
  });

  MapConfig copyWith({
    int? relativeDays,
    bool? favoritesOnly,
    bool? includeArchived,
    ThemeMode? themeMode,
    bool? withPartners,
  }) => MapConfig(
    relativeDays: relativeDays ?? this.relativeDays,
    favoritesOnly: favoritesOnly ?? this.favoritesOnly,
    includeArchived: includeArchived ?? this.includeArchived,
    themeMode: themeMode ?? this.themeMode,
    withPartners: withPartners ?? this.withPartners,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MapConfig &&
          other.relativeDays == relativeDays &&
          other.favoritesOnly == favoritesOnly &&
          other.includeArchived == includeArchived &&
          other.themeMode == themeMode &&
          other.withPartners == withPartners);

  @override
  int get hashCode => Object.hash(relativeDays, favoritesOnly, includeArchived, themeMode, withPartners);

  @override
  String toString() =>
      'MapConfig(relativeDays: $relativeDays, favoritesOnly: $favoritesOnly, includeArchived: $includeArchived, themeMode: $themeMode, withPartners: $withPartners)';
}
