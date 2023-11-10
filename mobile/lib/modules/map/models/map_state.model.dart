import 'package:vector_map_tiles/vector_map_tiles.dart';

class MapState {
  final bool isDarkTheme;
  final bool showFavoriteOnly;
  final bool includeArchived;
  final int relativeTime;
  final Style? mapStyle;
  final bool isLoading;

  MapState({
    this.isDarkTheme = false,
    this.showFavoriteOnly = false,
    this.includeArchived = false,
    this.relativeTime = 0,
    this.mapStyle,
    this.isLoading = false,
  });

  MapState copyWith({
    bool? isDarkTheme,
    bool? showFavoriteOnly,
    bool? includeArchived,
    int? relativeTime,
    Style? mapStyle,
    bool? isLoading,
  }) {
    return MapState(
      isDarkTheme: isDarkTheme ?? this.isDarkTheme,
      showFavoriteOnly: showFavoriteOnly ?? this.showFavoriteOnly,
      includeArchived: includeArchived ?? this.includeArchived,
      relativeTime: relativeTime ?? this.relativeTime,
      mapStyle: mapStyle ?? this.mapStyle,
      isLoading: isLoading ?? this.isLoading,
    );
  }

  @override
  String toString() {
    return 'MapSettingsState(isDarkTheme: $isDarkTheme, showFavoriteOnly: $showFavoriteOnly, relativeTime: $relativeTime, includeArchived: $includeArchived, mapStyle: $mapStyle, isLoading: $isLoading)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MapState &&
        other.isDarkTheme == isDarkTheme &&
        other.showFavoriteOnly == showFavoriteOnly &&
        other.relativeTime == relativeTime &&
        other.includeArchived == includeArchived &&
        other.mapStyle == mapStyle &&
        other.isLoading == isLoading;
  }

  @override
  int get hashCode {
    return isDarkTheme.hashCode ^
        showFavoriteOnly.hashCode ^
        relativeTime.hashCode ^
        includeArchived.hashCode ^
        mapStyle.hashCode ^
        isLoading.hashCode;
  }
}
