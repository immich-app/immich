class MapState {
  final bool isDarkTheme;
  final bool showFavoriteOnly;
  final int relativeTime;

  MapState({
    this.isDarkTheme = false,
    this.showFavoriteOnly = false,
    this.relativeTime = 0,
  });

  MapState copyWith({
    bool? isDarkTheme,
    bool? showFavoriteOnly,
    int? relativeTime,
  }) {
    return MapState(
      isDarkTheme: isDarkTheme ?? this.isDarkTheme,
      showFavoriteOnly: showFavoriteOnly ?? this.showFavoriteOnly,
      relativeTime: relativeTime ?? this.relativeTime,
    );
  }

  @override
  String toString() {
    return 'MapSettingsState(isDarkTheme: $isDarkTheme, showFavoriteOnly: $showFavoriteOnly, relativeTime: $relativeTime)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MapState &&
        other.isDarkTheme == isDarkTheme &&
        other.showFavoriteOnly == showFavoriteOnly &&
        other.relativeTime == relativeTime;
  }

  @override
  int get hashCode {
    return isDarkTheme.hashCode ^
        showFavoriteOnly.hashCode ^
        relativeTime.hashCode;
  }
}
