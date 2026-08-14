import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

part 'map_state.model.freezed.dart';

@freezed
abstract class MapState with _$MapState {
  const factory MapState({
    @Default(ThemeMode.system) ThemeMode themeMode,
    @Default(false) bool showFavoriteOnly,
    @Default(false) bool includeArchived,
    @Default(false) bool withPartners,
    @Default(0) int relativeTime,
    @Default(false) bool shouldRefetchMarkers,
    @Default(AsyncLoading<String>()) AsyncValue<String> lightStyleFetched,
    @Default(AsyncLoading<String>()) AsyncValue<String> darkStyleFetched,
  }) = _MapState;
}
