// ignore_for_file: annotate_overrides

import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/option.dart';

part 'map_config.freezed.dart';

@Freezed(copyWith: false)
class const MapConfig({
  final int relativeDays = 0,
  final bool favoritesOnly = false,
  final bool includeArchived = false,
  final ThemeMode themeMode = .system,
  final bool withPartners = false,
  final DateTime? customFrom,
  final DateTime? customTo,
}) with _$MapConfig {
  // We patch `customFrom` and `customTo`, which prevents us from using Freezed `copyWith`
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
    customFrom: customFrom.patch(this.customFrom),
    customTo: customTo.patch(this.customTo),
  );
}
