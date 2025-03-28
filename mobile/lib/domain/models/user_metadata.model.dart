import 'dart:ui';

enum AvatarColor {
  // do not change this order or reuse indices for other purposes, adding is OK
  primary("primary"),
  pink("pink"),
  red("red"),
  yellow("yellow"),
  blue("blue"),
  green("green"),
  purple("purple"),
  orange("orange"),
  gray("gray"),
  amber("amber");

  final String value;
  const AvatarColor(this.value);

  Color toColor({bool isDarkTheme = false}) => switch (this) {
        AvatarColor.primary =>
          isDarkTheme ? const Color(0xFFABCBFA) : const Color(0xFF4250AF),
        AvatarColor.pink => const Color.fromARGB(255, 244, 114, 182),
        AvatarColor.red => const Color.fromARGB(255, 239, 68, 68),
        AvatarColor.yellow => const Color.fromARGB(255, 234, 179, 8),
        AvatarColor.blue => const Color.fromARGB(255, 59, 130, 246),
        AvatarColor.green => const Color.fromARGB(255, 22, 163, 74),
        AvatarColor.purple => const Color.fromARGB(255, 147, 51, 234),
        AvatarColor.orange => const Color.fromARGB(255, 234, 88, 12),
        AvatarColor.gray => const Color.fromARGB(255, 75, 85, 99),
        AvatarColor.amber => const Color.fromARGB(255, 217, 119, 6),
      };
}

class UserPreferences {
  final bool foldersEnabled;
  final bool memoriesEnabled;
  final bool peopleEnabled;
  final bool ratingsEnabled;
  final bool sharedLinksEnabled;
  final bool tagsEnabled;
  final AvatarColor userAvatarColor;
  final bool showSupportBadge;

  const UserPreferences({
    this.foldersEnabled = false,
    this.memoriesEnabled = true,
    this.peopleEnabled = true,
    this.ratingsEnabled = false,
    this.sharedLinksEnabled = true,
    this.tagsEnabled = false,
    this.userAvatarColor = AvatarColor.primary,
    this.showSupportBadge = true,
  });

  UserPreferences copyWith({
    bool? foldersEnabled,
    bool? memoriesEnabled,
    bool? peopleEnabled,
    bool? ratingsEnabled,
    bool? sharedLinksEnabled,
    bool? tagsEnabled,
    AvatarColor? userAvatarColor,
    bool? showSupportBadge,
  }) {
    return UserPreferences(
      foldersEnabled: foldersEnabled ?? this.foldersEnabled,
      memoriesEnabled: memoriesEnabled ?? this.memoriesEnabled,
      peopleEnabled: peopleEnabled ?? this.peopleEnabled,
      ratingsEnabled: ratingsEnabled ?? this.ratingsEnabled,
      sharedLinksEnabled: sharedLinksEnabled ?? this.sharedLinksEnabled,
      tagsEnabled: tagsEnabled ?? this.tagsEnabled,
      userAvatarColor: userAvatarColor ?? this.userAvatarColor,
      showSupportBadge: showSupportBadge ?? this.showSupportBadge,
    );
  }

  Map<String, Object?> toMap() {
    final preferences = <String, Object?>{};
    preferences["folders-Enabled"] = foldersEnabled;
    preferences["memories-Enabled"] = memoriesEnabled;
    preferences["people-Enabled"] = peopleEnabled;
    preferences["ratings-Enabled"] = ratingsEnabled;
    preferences["sharedLinks-Enabled"] = sharedLinksEnabled;
    preferences["tags-Enabled"] = tagsEnabled;
    preferences["avatar-Color"] = userAvatarColor.value;
    preferences["purchase-ShowSupportBadge"] = showSupportBadge;
    return preferences;
  }

  factory UserPreferences.fromMap(Map<String, Object?> map) {
    return UserPreferences(
      foldersEnabled: map["folders-Enabled"] as bool? ?? false,
      memoriesEnabled: map["memories-Enabled"] as bool? ?? true,
      peopleEnabled: map["people-Enabled"] as bool? ?? true,
      ratingsEnabled: map["ratings-Enabled"] as bool? ?? false,
      sharedLinksEnabled: map["sharedLinks-Enabled"] as bool? ?? true,
      tagsEnabled: map["tags-Enabled"] as bool? ?? false,
      userAvatarColor: AvatarColor.values.firstWhere(
        (e) => e.value == map["avatar-Color"] as String?,
        orElse: () => AvatarColor.primary,
      ),
      showSupportBadge: map["purchase-ShowSupportBadge"] as bool? ?? true,
    );
  }
}
