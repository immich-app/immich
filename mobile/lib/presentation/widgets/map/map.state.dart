import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/time_range.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/providers/infrastructure/map.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapState {
  final ThemeMode themeMode;
  final LatLngBounds bounds;
  final bool onlyFavorites;
  final bool includeArchived;
  final bool withPartners;
  final int relativeDays;
  final TimeRange timeRange;

  const MapState({
    this.themeMode = ThemeMode.system,
    required this.bounds,
    this.onlyFavorites = false,
    this.includeArchived = false,
    this.withPartners = false,
    this.relativeDays = 0,
    this.timeRange = const TimeRange(),
  });

  @override
  bool operator ==(covariant MapState other) {
    return bounds == other.bounds;
  }

  @override
  int get hashCode => bounds.hashCode;

  MapState copyWith({
    LatLngBounds? bounds,
    ThemeMode? themeMode,
    bool? onlyFavorites,
    bool? includeArchived,
    bool? withPartners,
    int? relativeDays,
    TimeRange? timeRange,
  }) {
    return MapState(
      bounds: bounds ?? this.bounds,
      themeMode: themeMode ?? this.themeMode,
      onlyFavorites: onlyFavorites ?? this.onlyFavorites,
      includeArchived: includeArchived ?? this.includeArchived,
      withPartners: withPartners ?? this.withPartners,
      relativeDays: relativeDays ?? this.relativeDays,
      timeRange: timeRange ?? this.timeRange,
    );
  }

  TimelineMapOptions toOptions() => TimelineMapOptions(
    bounds: bounds,
    onlyFavorites: onlyFavorites,
    includeArchived: includeArchived,
    withPartners: withPartners,
    relativeDays: relativeDays,
    timeRange: timeRange,
  );
}

class MapStateNotifier extends Notifier<MapState> {
  MapStateNotifier();

  bool setBounds(LatLngBounds bounds) {
    if (state.bounds == bounds) {
      return false;
    }
    state = state.copyWith(bounds: bounds);
    return true;
  }

  void switchTheme(ThemeMode mode) {
    // TODO: Remove this line when map theme provider is removed
    // Until then, keep both in sync as MapThemeOverride uses map state provider
    // ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.mapThemeMode, mode.index);
    ref.read(mapStateNotifierProvider.notifier).switchTheme(mode);
    state = state.copyWith(themeMode: mode);
  }

  void switchFavoriteOnly(bool isFavoriteOnly) {
    ref.read(settingsProvider).write(.mapShowFavoriteOnly, isFavoriteOnly);
    state = state.copyWith(onlyFavorites: isFavoriteOnly);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void switchIncludeArchived(bool isIncludeArchived) {
    ref.read(settingsProvider).write(.mapIncludeArchived, isIncludeArchived);
    state = state.copyWith(includeArchived: isIncludeArchived);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void switchWithPartners(bool isWithPartners) {
    ref.read(settingsProvider).write(.mapWithPartners, isWithPartners);
    state = state.copyWith(withPartners: isWithPartners);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void setRelativeTime(int relativeDays) {
    ref.read(settingsProvider).write(.mapRelativeDate, relativeDays);
    state = state.copyWith(relativeDays: relativeDays);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void setCustomTimeRange(TimeRange range) {
    ref.read(settingsProvider).write(.mapCustomFrom, range.from);
    ref.read(settingsProvider).write(.mapCustomTo, range.to);
    state = state.copyWith(timeRange: range);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  Option<DateTime> parseDateOption(String s) {
    try {
      if (s.trim().isEmpty) {
        return const Option.none();
      }
      return Option.some(DateTime.parse(s));
    } catch (_) {
      return const Option.none();
    }
  }

  @override
  MapState build() {
    final mapConfig = ref.read(appConfigProvider.select((config) => config.map));
    return MapState(
      themeMode: mapConfig.themeMode,
      onlyFavorites: mapConfig.favoritesOnly,
      includeArchived: mapConfig.includeArchived,
      withPartners: mapConfig.withPartners,
      relativeDays: mapConfig.relativeDays,
      bounds: LatLngBounds(northeast: const LatLng(0, 0), southwest: const LatLng(0, 0)),
      timeRange: TimeRange(from: mapConfig.customFrom, to: mapConfig.customTo),
    );
  }
}

// This provider watches the markers from the map service and serves the markers.
// It should be used only after the map service provider is overridden
final mapMarkerProvider = FutureProvider.family<Map<String, dynamic>, LatLngBounds?>((ref, bounds) async {
  final mapService = ref.watch(mapServiceProvider);
  final markers = await mapService.getMarkers(bounds);
  final features = List.filled(markers.length, const <String, dynamic>{});
  for (int i = 0; i < markers.length; i++) {
    final marker = markers[i];
    features[i] = {
      'type': 'Feature',
      'id': marker.assetId,
      'geometry': {
        'type': 'Point',
        'coordinates': [marker.location.longitude, marker.location.latitude],
      },
    };
  }
  return {'type': 'FeatureCollection', 'features': features};
}, dependencies: [mapServiceProvider]);

final mapStateProvider = NotifierProvider<MapStateNotifier, MapState>(MapStateNotifier.new);
