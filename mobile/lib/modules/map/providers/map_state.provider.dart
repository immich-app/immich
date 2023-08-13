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
          ),
        );

  final AppSettingsService appSettingsProvider;

  bool isDarkTheme() => state.isDarkTheme;

  void switchTheme(bool isDarkTheme) {
    state = state.copyWith(isDarkTheme: isDarkTheme);
  }

  void switchFavoriteOnly(bool isFavoriteOnly) =>
      state = state.copyWith(showFavoriteOnly: isFavoriteOnly);

  void setRelativeTime(int relativeTime) =>
      state = state.copyWith(relativeTime: relativeTime);
}

final mapStateNotifier =
    StateNotifierProvider<MapStateNotifier, MapState>((ref) {
  return MapStateNotifier(ref.watch(appSettingsServiceProvider));
});
