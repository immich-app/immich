import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/map/map_state.model.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
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
    unawaited(ref.read(settingsProvider).write(.mapThemeMode, mode));
    state = state.copyWith(themeMode: mode);
  }
}
