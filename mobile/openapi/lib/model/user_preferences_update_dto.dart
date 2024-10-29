//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserPreferencesUpdateDto {
  /// Returns a new [UserPreferencesUpdateDto] instance.
  UserPreferencesUpdateDto({
    this.avatar,
    this.download,
    this.emailNotifications,
    this.folders,
    this.memories,
    this.people,
    this.purchase,
    this.ratings,
    this.tags,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AvatarUpdate? avatar;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DownloadUpdate? download;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  EmailNotificationsUpdate? emailNotifications;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  FoldersUpdate? folders;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  MemoriesUpdate? memories;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  PeopleUpdate? people;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  PurchaseUpdate? purchase;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  RatingsUpdate? ratings;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  TagsUpdate? tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserPreferencesUpdateDto &&
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
    (avatar == null ? 0 : avatar!.hashCode) +
    (download == null ? 0 : download!.hashCode) +
    (emailNotifications == null ? 0 : emailNotifications!.hashCode) +
    (folders == null ? 0 : folders!.hashCode) +
    (memories == null ? 0 : memories!.hashCode) +
    (people == null ? 0 : people!.hashCode) +
    (purchase == null ? 0 : purchase!.hashCode) +
    (ratings == null ? 0 : ratings!.hashCode) +
    (tags == null ? 0 : tags!.hashCode);

  @override
  String toString() => 'UserPreferencesUpdateDto[avatar=$avatar, download=$download, emailNotifications=$emailNotifications, folders=$folders, memories=$memories, people=$people, purchase=$purchase, ratings=$ratings, tags=$tags]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatar != null) {
      json[r'avatar'] = this.avatar;
    } else {
    //  json[r'avatar'] = null;
    }
    if (this.download != null) {
      json[r'download'] = this.download;
    } else {
    //  json[r'download'] = null;
    }
    if (this.emailNotifications != null) {
      json[r'emailNotifications'] = this.emailNotifications;
    } else {
    //  json[r'emailNotifications'] = null;
    }
    if (this.folders != null) {
      json[r'folders'] = this.folders;
    } else {
    //  json[r'folders'] = null;
    }
    if (this.memories != null) {
      json[r'memories'] = this.memories;
    } else {
    //  json[r'memories'] = null;
    }
    if (this.people != null) {
      json[r'people'] = this.people;
    } else {
    //  json[r'people'] = null;
    }
    if (this.purchase != null) {
      json[r'purchase'] = this.purchase;
    } else {
    //  json[r'purchase'] = null;
    }
    if (this.ratings != null) {
      json[r'ratings'] = this.ratings;
    } else {
    //  json[r'ratings'] = null;
    }
    if (this.tags != null) {
      json[r'tags'] = this.tags;
    } else {
    //  json[r'tags'] = null;
    }
    return json;
  }

  /// Returns a new [UserPreferencesUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserPreferencesUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "UserPreferencesUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserPreferencesUpdateDto(
        avatar: AvatarUpdate.fromJson(json[r'avatar']),
        download: DownloadUpdate.fromJson(json[r'download']),
        emailNotifications: EmailNotificationsUpdate.fromJson(json[r'emailNotifications']),
        folders: FoldersUpdate.fromJson(json[r'folders']),
        memories: MemoriesUpdate.fromJson(json[r'memories']),
        people: PeopleUpdate.fromJson(json[r'people']),
        purchase: PurchaseUpdate.fromJson(json[r'purchase']),
        ratings: RatingsUpdate.fromJson(json[r'ratings']),
        tags: TagsUpdate.fromJson(json[r'tags']),
      );
    }
    return null;
  }

  static List<UserPreferencesUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserPreferencesUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserPreferencesUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserPreferencesUpdateDto> mapFromJson(dynamic json) {
    final map = <String, UserPreferencesUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserPreferencesUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserPreferencesUpdateDto-objects as value to a dart map
  static Map<String, List<UserPreferencesUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserPreferencesUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserPreferencesUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

