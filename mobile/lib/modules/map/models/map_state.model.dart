class MapState {
  final bool isDarkTheme;
  final bool showFavoriteOnly;

  MapState({
    required this.isDarkTheme,
    required this.showFavoriteOnly,
  });

  MapState copyWith({
    bool? isDarkTheme,
    bool? showFavoriteOnly,
  }) {
    return MapState(
      isDarkTheme: isDarkTheme ?? this.isDarkTheme,
      showFavoriteOnly: showFavoriteOnly ?? this.showFavoriteOnly,
    );
  }

  @override
  String toString() {
    return 'MapSettingsState(isDarkTheme: $isDarkTheme, showFavoriteOnly: $showFavoriteOnly)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MapState &&
        other.isDarkTheme == isDarkTheme &&
        other.showFavoriteOnly == showFavoriteOnly;
  }

  @override
  int get hashCode {
    return isDarkTheme.hashCode ^ showFavoriteOnly.hashCode;
  }
}
