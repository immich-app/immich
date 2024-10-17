//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserPreferencesResponseDto {
  /// Returns a new [UserPreferencesResponseDto] instance.
  UserPreferencesResponseDto({
    required this.avatar,
    required this.download,
    required this.emailNotifications,
    required this.folders,
    required this.memories,
    required this.people,
    required this.purchase,
    required this.ratings,
    required this.tags,
  });

  AvatarResponse avatar;

  DownloadResponse download;

  EmailNotificationsResponse emailNotifications;

  FoldersResponse folders;

  MemoriesResponse memories;

  PeopleResponse people;

  PurchaseResponse purchase;

  RatingsResponse ratings;

  TagsResponse tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserPreferencesResponseDto &&
    other.avatar == avatar &&
    other.download == download &&
    other.emailNotifications == emailNotifications &&
    other.folders == folders &&
    other.memories == memories &&
    other.people == people &&
    other.purchase == purchase &&
    other.ratings == ratings &&
    other.tags == tags;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatar.hashCode) +
    (download.hashCode) +
    (emailNotifications.hashCode) +
    (folders.hashCode) +
    (memories.hashCode) +
    (people.hashCode) +
    (purchase.hashCode) +
    (ratings.hashCode) +
    (tags.hashCode);

  @override
  String toString() => 'UserPreferencesResponseDto[avatar=$avatar, download=$download, emailNotifications=$emailNotifications, folders=$folders, memories=$memories, people=$people, purchase=$purchase, ratings=$ratings, tags=$tags]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatar'] = this.avatar;
      json[r'download'] = this.download;
      json[r'emailNotifications'] = this.emailNotifications;
      json[r'folders'] = this.folders;
      json[r'memories'] = this.memories;
      json[r'people'] = this.people;
      json[r'purchase'] = this.purchase;
      json[r'ratings'] = this.ratings;
      json[r'tags'] = this.tags;
    return json;
  }

  /// Returns a new [UserPreferencesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserPreferencesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "UserPreferencesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserPreferencesResponseDto(
        avatar: AvatarResponse.fromJson(json[r'avatar'])!,
        download: DownloadResponse.fromJson(json[r'download'])!,
        emailNotifications: EmailNotificationsResponse.fromJson(json[r'emailNotifications'])!,
        folders: FoldersResponse.fromJson(json[r'folders'])!,
        memories: MemoriesResponse.fromJson(json[r'memories'])!,
        people: PeopleResponse.fromJson(json[r'people'])!,
        purchase: PurchaseResponse.fromJson(json[r'purchase'])!,
        ratings: RatingsResponse.fromJson(json[r'ratings'])!,
        tags: TagsResponse.fromJson(json[r'tags'])!,
      );
    }
    return null;
  }

  static List<UserPreferencesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserPreferencesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserPreferencesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserPreferencesResponseDto> mapFromJson(dynamic json) {
    final map = <String, UserPreferencesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserPreferencesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserPreferencesResponseDto-objects as value to a dart map
  static Map<String, List<UserPreferencesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserPreferencesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserPreferencesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatar',
    'download',
    'emailNotifications',
    'folders',
    'memories',
    'people',
    'purchase',
    'ratings',
    'tags',
  };
}

