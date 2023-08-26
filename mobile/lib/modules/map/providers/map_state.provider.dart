import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/models/map_state.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class MapStateNotifier extends StateNotifier<MapState> {
  MapStateNotifier(this.appSettingsProvider)
      : super(
          MapState(
            isDarkTheme: appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapThemeMode),
            showFavoriteOnly: appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapShowFavoriteOnly),
            relativeTime: appSettingsProvider
                .getSetting<int>(AppSettingsEnum.mapRelativeDate),
          ),
        );

  final AppSettingsService appSettingsProvider;

  bool get isDarkTheme => state.isDarkTheme;

  void switchTheme(bool isDarkTheme) {
    appSettingsProvider.setSetting(
      AppSettingsEnum.mapThemeMode,
      isDarkTheme,
    );
    state = state.copyWith(isDarkTheme: isDarkTheme);
  }

  void switchFavoriteOnly(bool isFavoriteOnly) {
    appSettingsProvider.setSetting(
      AppSettingsEnum.mapShowFavoriteOnly,
      appSettingsProvider,
    );
    state = state.copyWith(showFavoriteOnly: isFavoriteOnly);
  }

  void setRelativeTime(int relativeTime) {
    appSettingsProvider.setSetting(
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
