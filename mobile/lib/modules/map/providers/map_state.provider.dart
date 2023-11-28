import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/models/map_state.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:vector_map_tiles/vector_map_tiles.dart';

class MapStateNotifier extends StateNotifier<MapState> {
  MapStateNotifier(this._appSettingsProvider, this._apiService)
      : super(
          MapState(
            isDarkTheme: _appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapThemeMode),
            showFavoriteOnly: _appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapShowFavoriteOnly),
            includeArchived: _appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapIncludeArchived),
            relativeTime: _appSettingsProvider
                .getSetting<int>(AppSettingsEnum.mapRelativeDate),
            isLoading: true,
          ),
        ) {
    _fetchStyleFromServer(
      _appSettingsProvider.getSetting<bool>(AppSettingsEnum.mapThemeMode),
    );
  }

  final AppSettingsService _appSettingsProvider;
  final ApiService _apiService;
  final Logger _log = Logger("MapStateNotifier");

  bool get isRaster =>
      state.mapStyle != null && state.mapStyle!.rasterTileProvider != null;

  double get maxZoom =>
      (isRaster ? state.mapStyle!.rasterTileProvider!.maximumZoom : 14)
          .toDouble();

  void switchTheme(bool isDarkTheme) {
    _updateThemeMode(isDarkTheme);
    _fetchStyleFromServer(isDarkTheme);
  }

  void _updateThemeMode(bool isDarkTheme) {
    _appSettingsProvider.setSetting(
      AppSettingsEnum.mapThemeMode,
      isDarkTheme,
    );
    state = state.copyWith(isDarkTheme: isDarkTheme, isLoading: true);
  }

  void _fetchStyleFromServer(bool isDarkTheme) async {
    final styleResponse = await _apiService.systemConfigApi
        .getMapStyleWithHttpInfo(isDarkTheme ? MapTheme.dark : MapTheme.light);
    if (styleResponse.statusCode >= HttpStatus.badRequest) {
      throw ApiException(styleResponse.statusCode, styleResponse.body);
    }
    final styleJsonString = styleResponse.body.isNotEmpty &&
            styleResponse.statusCode != HttpStatus.noContent
        ? styleResponse.body
        : null;

    if (styleJsonString == null) {
      _log.severe('Style JSON from server is empty');
      return;
    }
    final styleJson = await compute(jsonDecode, styleJsonString);
    if (styleJson is! Map<String, dynamic>) {
      _log.severe('Style JSON from server is invalid');
      return;
    }
    final styleReader = StyleReader(uri: '');
    Style? style;
    try {
      style = await styleReader.readFromMap(styleJson);
    } finally {
      // Consume all error
    }
    state = state.copyWith(
      mapStyle: style,
      isLoading: false,
    );
  }

  void switchFavoriteOnly(bool isFavoriteOnly) {
    _appSettingsProvider.setSetting(
      AppSettingsEnum.mapShowFavoriteOnly,
      isFavoriteOnly,
    );
    state = state.copyWith(showFavoriteOnly: isFavoriteOnly);
  }

  void switchIncludeArchived(bool isIncludeArchived) {
    _appSettingsProvider.setSetting(
      AppSettingsEnum.mapIncludeArchived,
      isIncludeArchived,
    );
    state = state.copyWith(includeArchived: isIncludeArchived);
  }

  void setRelativeTime(int relativeTime) {
    _appSettingsProvider.setSetting(
      AppSettingsEnum.mapRelativeDate,
      relativeTime,
    );
    state = state.copyWith(relativeTime: relativeTime);
  }

  Widget getTileLayer([bool forceDark = false]) {
    if (isRaster) {
      final rasterProvider = state.mapStyle!.rasterTileProvider;
      final rasterLayer = TileLayer(
        urlTemplate: rasterProvider!.url,
        maxNativeZoom: rasterProvider.maximumZoom,
        maxZoom: rasterProvider.maximumZoom.toDouble(),
      );
      return state.isDarkTheme || forceDark
          ? InvertionFilter(
              child: SaturationFilter(
                saturation: -1,
                child: BrightnessFilter(
                  brightness: -1,
                  child: rasterLayer,
                ),
              ),
            )
          : rasterLayer;
    }
    if (state.mapStyle != null && !isRaster) {
      return VectorTileLayer(
        // Tiles and themes will be set for vector providers
        tileProviders: state.mapStyle!.providers!,
        theme: state.mapStyle!.theme!,
        sprites: state.mapStyle!.sprites,
        concurrency: 6,
      );
    }
    return const Center(child: ImmichLoadingIndicator());
  }
}

final mapStateNotifier =
    StateNotifierProvider<MapStateNotifier, MapState>((ref) {
  return MapStateNotifier(
    ref.watch(appSettingsServiceProvider),
    ref.watch(apiServiceProvider),
  );
});
