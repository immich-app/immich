import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class MapState {
  final ThemeMode themeMode;
  final bool showFavoriteOnly;
  final bool includeArchived;
  final bool withPartners;
  final int relativeTime;
  final bool shouldRefetchMarkers;
  final AsyncValue<String> lightStyleFetched;
  final AsyncValue<String> darkStyleFetched;

  MapState({
    this.themeMode = ThemeMode.system,
    this.showFavoriteOnly = false,
    this.includeArchived = false,
    this.withPartners = false,
    this.relativeTime = 0,
    this.shouldRefetchMarkers = false,
    this.lightStyleFetched = const AsyncLoading(),
    this.darkStyleFetched = const AsyncLoading(),
  });

  MapState copyWith({
    ThemeMode? themeMode,
    bool? showFavoriteOnly,
    bool? includeArchived,
    bool? withPartners,
    int? relativeTime,
    bool? shouldRefetchMarkers,
    AsyncValue<String>? lightStyleFetched,
    AsyncValue<String>? darkStyleFetched,
  }) {
    return MapState(
      themeMode: themeMode ?? this.themeMode,
      showFavoriteOnly: showFavoriteOnly ?? this.showFavoriteOnly,
      includeArchived: includeArchived ?? this.includeArchived,
      withPartners: withPartners ?? this.withPartners,
      relativeTime: relativeTime ?? this.relativeTime,
      shouldRefetchMarkers: shouldRefetchMarkers ?? this.shouldRefetchMarkers,
      lightStyleFetched: lightStyleFetched ?? this.lightStyleFetched,
      darkStyleFetched: darkStyleFetched ?? this.darkStyleFetched,
    );
  }

  @override
  String toString() {
    return 'MapState(themeMode: $themeMode, showFavoriteOnly: $showFavoriteOnly, includeArchived: $includeArchived, withPartners: $withPartners, relativeTime: $relativeTime, shouldRefetchMarkers: $shouldRefetchMarkers, lightStyleFetched: $lightStyleFetched, darkStyleFetched: $darkStyleFetched)';
  }

  @override
  bool operator ==(covariant MapState other) {
    if (identical(this, other)) return true;

    return other.themeMode == themeMode &&
        other.showFavoriteOnly == showFavoriteOnly &&
        other.includeArchived == includeArchived &&
        other.withPartners == withPartners &&
        other.relativeTime == relativeTime &&
        other.shouldRefetchMarkers == shouldRefetchMarkers &&
        other.lightStyleFetched == lightStyleFetched &&
        other.darkStyleFetched == darkStyleFetched;
  }

  @override
  int get hashCode {
    return themeMode.hashCode ^
        showFavoriteOnly.hashCode ^
        includeArchived.hashCode ^
        withPartners.hashCode ^
        relativeTime.hashCode ^
        shouldRefetchMarkers.hashCode ^
        lightStyleFetched.hashCode ^
        darkStyleFetched.hashCode;
  }
}
