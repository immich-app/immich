import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/models/map_state.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class MapStateNotifier extends StateNotifier<MapState> {
  MapStateNotifier(this._appSettingsProvider)
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
          ),
        );

  final AppSettingsService _appSettingsProvider;

  void switchTheme(bool isDarkTheme) {
    _appSettingsProvider.setSetting(
      AppSettingsEnum.mapThemeMode,
      isDarkTheme,
    );
    state = state.copyWith(isDarkTheme: isDarkTheme);
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
}

final mapStateNotifier =
    StateNotifierProvider<MapStateNotifier, MapState>((ref) {
  return MapStateNotifier(ref.watch(appSettingsServiceProvider));
});
