import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/option.dart';

part 'map_config.freezed.dart';

@Freezed(copyWith: false)
abstract class MapConfig with _$MapConfig {
  const MapConfig._();

  const factory MapConfig({
    @Default(0) int relativeDays,
    @Default(false) bool favoritesOnly,
    @Default(false) bool includeArchived,
    @Default(ThemeMode.system) ThemeMode themeMode,
    @Default(false) bool withPartners,
    DateTime? customFrom,
    DateTime? customTo,
  }) = _MapConfig;

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
