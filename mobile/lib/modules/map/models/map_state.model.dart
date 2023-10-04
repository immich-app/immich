class MapState {
  final bool isDarkTheme;
  final bool showFavoriteOnly;
  final bool includeArchived;
  final int relativeTime;

  MapState({
    this.isDarkTheme = false,
    this.showFavoriteOnly = false,
    this.includeArchived = false,
    this.relativeTime = 0,
  });

  MapState copyWith({
    bool? isDarkTheme,
    bool? showFavoriteOnly,
    bool? includeArchived,
    int? relativeTime,
  }) {
    return MapState(
      isDarkTheme: isDarkTheme ?? this.isDarkTheme,
      showFavoriteOnly: showFavoriteOnly ?? this.showFavoriteOnly,
      includeArchived: includeArchived ?? this.includeArchived,
      relativeTime: relativeTime ?? this.relativeTime,
    );
  }

  @override
  String toString() {
    return 'MapSettingsState(isDarkTheme: $isDarkTheme, showFavoriteOnly: $showFavoriteOnly, relativeTime: $relativeTime, includeArchived: $includeArchived)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MapState &&
        other.isDarkTheme == isDarkTheme &&
        other.showFavoriteOnly == showFavoriteOnly &&
        other.relativeTime == relativeTime &&
        other.includeArchived == includeArchived;
  }

  @override
  int get hashCode {
    return isDarkTheme.hashCode ^
        showFavoriteOnly.hashCode ^
        relativeTime.hashCode ^
        includeArchived.hashCode;
  }
}
