import 'dart:ui';

enum UserMetadata {
  preferences,
}

class _BaseUserPreference {
  final bool enabled;

  const _BaseUserPreference({required this.enabled});

  @override
  bool operator ==(covariant _BaseUserPreference other) {
    if (identical(this, other)) return true;

    return other.enabled == enabled;
  }

  @override
  int get hashCode => enabled.hashCode;
}

class UserFolderPreference extends _BaseUserPreference {
  const UserFolderPreference({super.enabled = false});

  Map<String, Object?> toMap() {
    return {"folders-Enabled": enabled};
  }

  factory UserFolderPreference.fromMap(Map<String, Object?> map) {
    return UserFolderPreference(
      enabled: map["folders-Enabled"] as bool? ?? false,
    );
  }
}

class UserMemoryPreference extends _BaseUserPreference {
  const UserMemoryPreference({super.enabled = true});

  Map<String, Object?> toMap() {
    return {"memories-Enabled": enabled};
  }

  factory UserMemoryPreference.fromMap(Map<String, Object?> map) {
    return UserMemoryPreference(
      enabled: map["memories-Enabled"] as bool? ?? true,
    );
  }
}

class UserPeoplePreference extends _BaseUserPreference {
  const UserPeoplePreference({super.enabled = true});

  Map<String, Object?> toMap() {
    return {"people-Enabled": enabled};
  }

  factory UserPeoplePreference.fromMap(Map<String, Object?> map) {
    return UserPeoplePreference(
      enabled: map["people-Enabled"] as bool? ?? true,
    );
  }
}

class UserRatingPreference extends _BaseUserPreference {
  const UserRatingPreference({super.enabled = false});

  Map<String, Object?> toMap() {
    return {"ratings-Enabled": enabled};
  }

  factory UserRatingPreference.fromMap(Map<String, Object?> map) {
    return UserRatingPreference(
      enabled: map["ratings-Enabled"] as bool? ?? false,
    );
  }
}

class UserSharedLinksPreference extends _BaseUserPreference {
  const UserSharedLinksPreference({super.enabled = true});

  Map<String, Object?> toMap() {
    return {"sharedLinks-Enabled": enabled};
  }

  factory UserSharedLinksPreference.fromMap(Map<String, Object?> map) {
    return UserSharedLinksPreference(
      enabled: map["sharedLinks-Enabled"] as bool? ?? true,
    );
  }
}

class UserTagPreference extends _BaseUserPreference {
  const UserTagPreference({super.enabled = false});

  Map<String, Object?> toMap() {
    return {"tags-Enabled": enabled};
  }

  factory UserTagPreference.fromMap(Map<String, Object?> map) {
    return UserTagPreference(enabled: map["tags-Enabled"] as bool? ?? false);
  }
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

class UserAvatarPreference {
  final AvatarColor color;

  const UserAvatarPreference({this.color = AvatarColor.primary});

  @override
  bool operator ==(covariant UserAvatarPreference other) {
    if (identical(this, other)) return true;

    return other.color == color;
  }

  @override
  int get hashCode => color.hashCode;

  Map<String, Object?> toMap() {
    return {"avatar-Color": color.value};
  }

  factory UserAvatarPreference.fromMap(Map<String, Object?> map) {
    return UserAvatarPreference(
      color: AvatarColor.values.firstWhere(
        (e) => e.value == map["avatar-Color"] as String?,
        orElse: () => AvatarColor.primary,
      ),
    );
  }
}

class UserPurchasePreference {
  final bool showSupportBadge;

  const UserPurchasePreference({this.showSupportBadge = true});

  @override
  bool operator ==(covariant UserPurchasePreference other) {
    if (identical(this, other)) return true;

    return other.showSupportBadge == showSupportBadge;
  }

  @override
  int get hashCode => showSupportBadge.hashCode;

  Map<String, Object?> toMap() {
    return {"purchase-ShowSupportBadge": showSupportBadge};
  }

  factory UserPurchasePreference.fromMap(Map<String, Object?> map) {
    return UserPurchasePreference(
      showSupportBadge: map["purchase-ShowSupportBadge"] as bool? ?? true,
    );
  }
}

class UserPreferences {
  final UserFolderPreference folders;
  final UserMemoryPreference memories;
  final UserPeoplePreference people;
  final UserRatingPreference ratings;
  final UserSharedLinksPreference sharedLinks;
  final UserTagPreference tags;
  final UserAvatarPreference avatar;
  final UserPurchasePreference purchase;

  const UserPreferences({
    this.folders = const UserFolderPreference(),
    this.memories = const UserMemoryPreference(),
    this.people = const UserPeoplePreference(),
    this.ratings = const UserRatingPreference(),
    this.sharedLinks = const UserSharedLinksPreference(),
    this.tags = const UserTagPreference(),
    this.avatar = const UserAvatarPreference(),
    this.purchase = const UserPurchasePreference(),
  });

  UserPreferences copyWith({
    UserFolderPreference? folders,
    UserMemoryPreference? memories,
    UserPeoplePreference? people,
    UserRatingPreference? ratings,
    UserSharedLinksPreference? sharedLinks,
    UserTagPreference? tags,
    UserAvatarPreference? avatar,
    UserPurchasePreference? purchase,
  }) =>
      UserPreferences(
        folders: folders ?? this.folders,
        memories: memories ?? this.memories,
        people: people ?? this.people,
        ratings: ratings ?? this.ratings,
        sharedLinks: sharedLinks ?? this.sharedLinks,
        tags: tags ?? this.tags,
        avatar: avatar ?? this.avatar,
        purchase: purchase ?? this.purchase,
      );

  Map<String, Object?> toMap() {
    final preferences = <String, Object?>{};
    preferences.addAll(folders.toMap());
    preferences.addAll(memories.toMap());
    preferences.addAll(people.toMap());
    preferences.addAll(ratings.toMap());
    preferences.addAll(sharedLinks.toMap());
    preferences.addAll(tags.toMap());
    preferences.addAll(avatar.toMap());
    preferences.addAll(purchase.toMap());
    return preferences;
  }

  factory UserPreferences.fromMap(Map<String, Object?> map) {
    return UserPreferences(
      folders: UserFolderPreference.fromMap(map),
      memories: UserMemoryPreference.fromMap(map),
      people: UserPeoplePreference.fromMap(map),
      ratings: UserRatingPreference.fromMap(map),
      sharedLinks: UserSharedLinksPreference.fromMap(map),
      tags: UserTagPreference.fromMap(map),
      avatar: UserAvatarPreference.fromMap(map),
      purchase: UserPurchasePreference.fromMap(map),
    );
  }
}
