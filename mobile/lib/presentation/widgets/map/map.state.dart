import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/map.provider.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapState {
  final ThemeMode themeMode;
  final LatLngBounds bounds;
  final bool onlyFavorites;
  final bool includeArchived;
  final bool withPartners;
  final int relativeDays;

  const MapState({
    this.themeMode = ThemeMode.system,
    required this.bounds,
    this.onlyFavorites = false,
    this.includeArchived = false,
    this.withPartners = false,
    this.relativeDays = 0,
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
  }) {
    return MapState(
      bounds: bounds ?? this.bounds,
      themeMode: themeMode ?? this.themeMode,
      onlyFavorites: onlyFavorites ?? this.onlyFavorites,
      includeArchived: includeArchived ?? this.includeArchived,
      withPartners: withPartners ?? this.withPartners,
      relativeDays: relativeDays ?? this.relativeDays,
    );
  }

  TimelineMapOptions toOptions() => TimelineMapOptions(
    bounds: bounds,
    onlyFavorites: onlyFavorites,
    includeArchived: includeArchived,
    withPartners: withPartners,
    relativeDays: relativeDays,
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
    ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.mapShowFavoriteOnly, isFavoriteOnly);
    state = state.copyWith(onlyFavorites: isFavoriteOnly);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void switchIncludeArchived(bool isIncludeArchived) {
    ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.mapIncludeArchived, isIncludeArchived);
    state = state.copyWith(includeArchived: isIncludeArchived);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void switchWithPartners(bool isWithPartners) {
    ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.mapwithPartners, isWithPartners);
    state = state.copyWith(withPartners: isWithPartners);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  void setRelativeTime(int relativeDays) {
    ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.mapRelativeDate, relativeDays);
    state = state.copyWith(relativeDays: relativeDays);
    EventStream.shared.emit(const MapMarkerReloadEvent());
  }

  @override
  MapState build() {
    final appSettingsService = ref.read(appSettingsServiceProvider);
    return MapState(
      themeMode: ThemeMode.values[appSettingsService.getSetting(AppSettingsEnum.mapThemeMode)],
      onlyFavorites: appSettingsService.getSetting(AppSettingsEnum.mapShowFavoriteOnly),
      includeArchived: appSettingsService.getSetting(AppSettingsEnum.mapIncludeArchived),
      withPartners: appSettingsService.getSetting(AppSettingsEnum.mapwithPartners),
      relativeDays: appSettingsService.getSetting(AppSettingsEnum.mapRelativeDate),
      bounds: LatLngBounds(northeast: const LatLng(0, 0), southwest: const LatLng(0, 0)),
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
