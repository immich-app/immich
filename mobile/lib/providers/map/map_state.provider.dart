import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/models/map/map_state.model.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

final mapStateNotifierProvider = NotifierProvider<MapStateNotifier, MapState>(MapStateNotifier.new);

class MapStateNotifier extends Notifier<MapState> {
  @override
  MapState build() {
    final mapConfig = ref.read(appConfigProvider.select((config) => config.map));

    final lightStyleUrl = ref.read(serverInfoProvider).serverConfig.mapLightStyleUrl;
    final darkStyleUrl = ref.read(serverInfoProvider).serverConfig.mapDarkStyleUrl;

    return MapState(
      themeMode: mapConfig.themeMode,
      showFavoriteOnly: mapConfig.favoritesOnly,
      includeArchived: mapConfig.includeArchived,
      withPartners: mapConfig.withPartners,
      relativeTime: mapConfig.relativeDays,
      lightStyleFetched: AsyncData(lightStyleUrl),
      darkStyleFetched: AsyncData(darkStyleUrl),
    );
  }

  void switchTheme(ThemeMode mode) {
    ref.read(metadataProvider).write(MetadataKey.mapThemeMode, mode);
    state = state.copyWith(themeMode: mode);
  }

  void switchFavoriteOnly(bool isFavoriteOnly) {
    ref.read(metadataProvider).write(MetadataKey.mapShowFavoriteOnly, isFavoriteOnly);
    state = state.copyWith(showFavoriteOnly: isFavoriteOnly, shouldRefetchMarkers: true);
  }

  void setRefetchMarkers(bool shouldRefetch) {
    state = state.copyWith(shouldRefetchMarkers: shouldRefetch);
  }

  void switchIncludeArchived(bool isIncludeArchived) {
    ref.read(metadataProvider).write(MetadataKey.mapIncludeArchived, isIncludeArchived);
    state = state.copyWith(includeArchived: isIncludeArchived, shouldRefetchMarkers: true);
  }

  void switchWithPartners(bool isWithPartners) {
    ref.read(metadataProvider).write(MetadataKey.mapWithPartners, isWithPartners);
    state = state.copyWith(withPartners: isWithPartners, shouldRefetchMarkers: true);
  }

  void setRelativeTime(int relativeTime) {
    ref.read(metadataProvider).write(MetadataKey.mapRelativeDate, relativeTime);
    state = state.copyWith(relativeTime: relativeTime, shouldRefetchMarkers: true);
  }
}
