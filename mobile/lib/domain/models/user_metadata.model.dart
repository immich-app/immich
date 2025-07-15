import 'dart:ui';

enum UserMetadataKey {
  // do not change this order!
  onboarding,
  preferences,
  license,
}

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

class Onboarding {
  final bool isOnboarded;

  const Onboarding({required this.isOnboarded});

  Onboarding copyWith({bool? isOnboarded}) {
    return Onboarding(isOnboarded: isOnboarded ?? this.isOnboarded);
  }

  Map<String, Object?> toMap() {
    final onboarding = <String, Object?>{};
    onboarding["isOnboarded"] = isOnboarded;
    return onboarding;
  }

  factory Onboarding.fromMap(Map<String, Object?> map) {
    return Onboarding(isOnboarded: map["isOnboarded"] as bool);
  }

  @override
  String toString() {
    return '''Onboarding {
isOnboarded: $isOnboarded,
}''';
  }

  @override
  bool operator ==(covariant Onboarding other) {
    if (identical(this, other)) return true;

    return isOnboarded == other.isOnboarded;
  }

  @override
  int get hashCode => isOnboarded.hashCode;
}

// TODO: wait to be overwritten
class Preferences {
  final bool foldersEnabled;
  final bool memoriesEnabled;
  final bool peopleEnabled;
  final bool ratingsEnabled;
  final bool sharedLinksEnabled;
  final bool tagsEnabled;
  final AvatarColor userAvatarColor;
  final bool showSupportBadge;

  const Preferences({
    this.foldersEnabled = false,
    this.memoriesEnabled = true,
    this.peopleEnabled = true,
    this.ratingsEnabled = false,
    this.sharedLinksEnabled = true,
    this.tagsEnabled = false,
    this.userAvatarColor = AvatarColor.primary,
    this.showSupportBadge = true,
  });

  Preferences copyWith({
    bool? foldersEnabled,
    bool? memoriesEnabled,
    bool? peopleEnabled,
    bool? ratingsEnabled,
    bool? sharedLinksEnabled,
    bool? tagsEnabled,
    AvatarColor? userAvatarColor,
    bool? showSupportBadge,
  }) {
    return Preferences(
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

  factory Preferences.fromMap(Map<String, Object?> map) {
    return Preferences(
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

  @override
  String toString() {
    return '''Preferences: {
foldersEnabled: $foldersEnabled,
memoriesEnabled: $memoriesEnabled,
peopleEnabled: $peopleEnabled,
ratingsEnabled: $ratingsEnabled,
sharedLinksEnabled: $sharedLinksEnabled,
tagsEnabled: $tagsEnabled,
userAvatarColor: $userAvatarColor,
showSupportBadge: $showSupportBadge,
}''';
  }

  @override
  bool operator ==(covariant Preferences other) {
    if (identical(this, other)) return true;

    return other.foldersEnabled == foldersEnabled &&
        other.memoriesEnabled == memoriesEnabled &&
        other.peopleEnabled == peopleEnabled &&
        other.ratingsEnabled == ratingsEnabled &&
        other.sharedLinksEnabled == sharedLinksEnabled &&
        other.tagsEnabled == tagsEnabled &&
        other.userAvatarColor == userAvatarColor &&
        other.showSupportBadge == showSupportBadge;
  }

  @override
  int get hashCode {
    return foldersEnabled.hashCode ^
        memoriesEnabled.hashCode ^
        peopleEnabled.hashCode ^
        ratingsEnabled.hashCode ^
        sharedLinksEnabled.hashCode ^
        tagsEnabled.hashCode ^
        userAvatarColor.hashCode ^
        showSupportBadge.hashCode;
  }
}

class License {
  final DateTime activatedAt;
  final String activationKey;
  final String licenseKey;

  const License({
    required this.activatedAt,
    required this.activationKey,
    required this.licenseKey,
  });

  License copyWith({
    DateTime? activatedAt,
    String? activationKey,
    String? licenseKey,
  }) {
    return License(
      activatedAt: activatedAt ?? this.activatedAt,
      activationKey: activationKey ?? this.activationKey,
      licenseKey: licenseKey ?? this.licenseKey,
    );
  }

  Map<String, Object?> toMap() {
    final license = <String, Object?>{};
    license["activatedAt"] = activatedAt;
    license["activationKey"] = activationKey;
    license["licenseKey"] = licenseKey;
    return license;
  }

  factory License.fromMap(Map<String, Object?> map) {
    return License(
      activatedAt: map["activatedAt"] as DateTime,
      activationKey: map["activationKey"] as String,
      licenseKey: map["licenseKey"] as String,
    );
  }

  @override
  String toString() {
    return '''License {
activatedAt: $activatedAt,
activationKey: $activationKey,
licenseKey: $licenseKey,
}''';
  }

  @override
  bool operator ==(covariant License other) {
    if (identical(this, other)) return true;

    return activatedAt == other.activatedAt &&
        activationKey == other.activationKey &&
        licenseKey == other.licenseKey;
  }

  @override
  int get hashCode =>
      activatedAt.hashCode ^ activationKey.hashCode ^ licenseKey.hashCode;
}

// Model for a user metadata stored in the server
class UserMetadata {
  final String userId;
  final UserMetadataKey key;
  final Onboarding? onboarding;
  final Preferences? preferences;
  final License? license;

  const UserMetadata({
    required this.userId,
    required this.key,
    this.onboarding,
    this.preferences,
    this.license,
  }) : assert(
          onboarding != null || preferences != null || license != null,
          'One of onboarding, preferences and license must be provided',
        );

  UserMetadata copyWith({
    String? userId,
    UserMetadataKey? key,
    Onboarding? onboarding,
    Preferences? preferences,
    License? license,
  }) {
    return UserMetadata(
      userId: userId ?? this.userId,
      key: key ?? this.key,
      onboarding: onboarding ?? this.onboarding,
      preferences: preferences ?? this.preferences,
      license: license ?? this.license,
    );
  }

  @override
  String toString() {
    return '''UserMetadata: {
userId: $userId,
key: $key,
onboarding: ${onboarding ?? "<NA>"},
preferences: ${preferences ?? "<NA>"},
license: ${license ?? "<NA>"},
}''';
  }

  @override
  bool operator ==(covariant UserMetadata other) {
    if (identical(this, other)) return true;

    return other.userId == userId &&
        other.key == key &&
        other.onboarding == onboarding &&
        other.preferences == preferences &&
        other.license == license;
  }

  @override
  int get hashCode {
    return userId.hashCode ^
        key.hashCode ^
        onboarding.hashCode ^
        preferences.hashCode ^
        license.hashCode;
  }
}
