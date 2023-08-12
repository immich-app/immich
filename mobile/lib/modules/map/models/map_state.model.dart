class MapSettingsState {
  final bool isDarkTheme;
  final bool showFavoriteOnly;

  MapSettingsState({
    required this.isDarkTheme,
    required this.showFavoriteOnly,
  });

  MapSettingsState copyWith({
    bool? isDarkTheme,
    bool? showFavoriteOnly,
  }) {
    return MapSettingsState(
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

    return other is MapSettingsState &&
        other.isDarkTheme == isDarkTheme &&
        other.showFavoriteOnly == showFavoriteOnly;
  }

  @override
  int get hashCode {
    return isDarkTheme.hashCode ^ showFavoriteOnly.hashCode;
  }
}
