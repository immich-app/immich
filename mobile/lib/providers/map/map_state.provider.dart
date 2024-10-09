import 'package:flutter/material.dart';
import 'package:immich_mobile/models/map/map_state.model.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'map_state.provider.g.dart';

@Riverpod(keepAlive: true)
class MapStateNotifier extends _$MapStateNotifier {
  @override
  MapState build() {
    final appSettingsProvider = ref.read(appSettingsServiceProvider);

    final lightStyleUrl =
        ref.read(serverInfoProvider).serverConfig.mapLightStyleUrl;
    final darkStyleUrl =
        ref.read(serverInfoProvider).serverConfig.mapDarkStyleUrl;

    return MapState(
      themeMode: ThemeMode.values[
          appSettingsProvider.getSetting<int>(AppSettingsEnum.mapThemeMode)],
      showFavoriteOnly: appSettingsProvider
          .getSetting<bool>(AppSettingsEnum.mapShowFavoriteOnly),
      includeArchived: appSettingsProvider
          .getSetting<bool>(AppSettingsEnum.mapIncludeArchived),
      withPartners:
          appSettingsProvider.getSetting<bool>(AppSettingsEnum.mapwithPartners),
      relativeTime:
          appSettingsProvider.getSetting<int>(AppSettingsEnum.mapRelativeDate),
      lightStyleFetched: AsyncData(lightStyleUrl),
      darkStyleFetched: AsyncData(darkStyleUrl),
    );
  }

  void switchTheme(ThemeMode mode) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.mapThemeMode,
          mode.index,
        );
    state = state.copyWith(themeMode: mode);
  }

  void switchFavoriteOnly(bool isFavoriteOnly) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.mapShowFavoriteOnly,
          isFavoriteOnly,
        );
    state = state.copyWith(
      showFavoriteOnly: isFavoriteOnly,
      shouldRefetchMarkers: true,
    );
  }

  void setRefetchMarkers(bool shouldRefetch) {
    state = state.copyWith(shouldRefetchMarkers: shouldRefetch);
  }

  void switchIncludeArchived(bool isIncludeArchived) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.mapIncludeArchived,
          isIncludeArchived,
        );
    state = state.copyWith(
      includeArchived: isIncludeArchived,
      shouldRefetchMarkers: true,
    );
  }

  void switchWithPartners(bool isWithPartners) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.mapwithPartners,
          isWithPartners,
        );
    state = state.copyWith(
      withPartners: isWithPartners,
      shouldRefetchMarkers: true,
    );
  }

  void setRelativeTime(int relativeTime) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.mapRelativeDate,
          relativeTime,
        );
    state = state.copyWith(
      relativeTime: relativeTime,
      shouldRefetchMarkers: true,
    );
  }
}
