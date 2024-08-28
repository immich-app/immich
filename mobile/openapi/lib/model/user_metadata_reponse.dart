//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserMetadataReponse {
  /// Returns a new [UserMetadataReponse] instance.
  UserMetadataReponse({
    required this.folder,
    required this.memory,
    required this.people,
    required this.rating,
    required this.tag,
  });

  FolderReponse folder;

  MemoryResponse memory;

  PeopleReponse people;

  RatingResponse rating;

  TagReponse tag;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserMetadataReponse &&
    other.folder == folder &&
    other.memory == memory &&
    other.people == people &&
    other.rating == rating &&
    other.tag == tag;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (folder.hashCode) +
    (memory.hashCode) +
    (people.hashCode) +
    (rating.hashCode) +
    (tag.hashCode);

  @override
  String toString() => 'UserMetadataReponse[folder=$folder, memory=$memory, people=$people, rating=$rating, tag=$tag]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'folder'] = this.folder;
      json[r'memory'] = this.memory;
      json[r'people'] = this.people;
      json[r'rating'] = this.rating;
      json[r'tag'] = this.tag;
    return json;
  }

  /// Returns a new [UserMetadataReponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserMetadataReponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserMetadataReponse(
        folder: FolderReponse.fromJson(json[r'folder'])!,
        memory: MemoryResponse.fromJson(json[r'memory'])!,
        people: PeopleReponse.fromJson(json[r'people'])!,
        rating: RatingResponse.fromJson(json[r'rating'])!,
        tag: TagReponse.fromJson(json[r'tag'])!,
      );
    }
    return null;
  }

  static List<UserMetadataReponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserMetadataReponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserMetadataReponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserMetadataReponse> mapFromJson(dynamic json) {
    final map = <String, UserMetadataReponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserMetadataReponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserMetadataReponse-objects as value to a dart map
  static Map<String, List<UserMetadataReponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserMetadataReponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserMetadataReponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'folder',
    'memory',
    'people',
    'rating',
    'tag',
  };
}

