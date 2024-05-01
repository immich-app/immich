import 'dart:io';

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/response_extensions.dart';
import 'package:immich_mobile/models/map/map_state.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:path_provider/path_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'map_state.provider.g.dart';

@Riverpod(keepAlive: true)
class MapStateNotifier extends _$MapStateNotifier {
  final _log = Logger("MapStateNotifier");

  @override
  MapState build() {
    final appSettingsProvider = ref.read(appSettingsServiceProvider);

    // Fetch and save the Style JSONs
    loadStyles();
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
    );
  }

  void loadStyles() async {
    final documents = (await getApplicationDocumentsDirectory()).path;

    // Set to loading
    state = state.copyWith(lightStyleFetched: const AsyncLoading());

    // Fetch and save light theme
    final lightResponse = await ref
        .read(apiServiceProvider)
        .systemConfigApi
        .getMapStyleWithHttpInfo(MapTheme.light);

    if (lightResponse.statusCode >= HttpStatus.badRequest) {
      state = state.copyWith(
        lightStyleFetched: AsyncError(lightResponse.body, StackTrace.current),
      );
      _log.severe(
        "Cannot fetch map light style",
        lightResponse.toLoggerString(),
      );
      return;
    }

    final lightJSON = lightResponse.body;
    final lightFile = await File("$documents/map-style-light.json")
        .writeAsString(lightJSON, flush: true);

    // Update state with path
    state =
        state.copyWith(lightStyleFetched: AsyncData(lightFile.absolute.path));

    // Set to loading
    state = state.copyWith(darkStyleFetched: const AsyncLoading());

    // Fetch and save dark theme
    final darkResponse = await ref
        .read(apiServiceProvider)
        .systemConfigApi
        .getMapStyleWithHttpInfo(MapTheme.dark);

    if (darkResponse.statusCode >= HttpStatus.badRequest) {
      state = state.copyWith(
        darkStyleFetched: AsyncError(darkResponse.body, StackTrace.current),
      );
      _log.severe("Cannot fetch map dark style", darkResponse.toLoggerString());
      return;
    }

    final darkJSON = darkResponse.body;
    final darkFile = await File("$documents/map-style-dark.json")
        .writeAsString(darkJSON, flush: true);

    // Update state with path
    state = state.copyWith(darkStyleFetched: AsyncData(darkFile.absolute.path));
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
