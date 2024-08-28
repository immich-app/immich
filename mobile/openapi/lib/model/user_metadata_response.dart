//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserMetadataResponse {
  /// Returns a new [UserMetadataResponse] instance.
  UserMetadataResponse({
    required this.folder,
    required this.memory,
    required this.people,
    required this.rating,
    required this.tag,
  });

  FolderResponse folder;

  MemoryResponse memory;

  PeopleResponse people;

  RatingResponse rating;

  TagResponse tag;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserMetadataResponse &&
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
  String toString() => 'UserMetadataResponse[folder=$folder, memory=$memory, people=$people, rating=$rating, tag=$tag]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'folder'] = this.folder;
      json[r'memory'] = this.memory;
      json[r'people'] = this.people;
      json[r'rating'] = this.rating;
      json[r'tag'] = this.tag;
    return json;
  }

  /// Returns a new [UserMetadataResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserMetadataResponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserMetadataResponse(
        folder: FolderResponse.fromJson(json[r'folder'])!,
        memory: MemoryResponse.fromJson(json[r'memory'])!,
        people: PeopleResponse.fromJson(json[r'people'])!,
        rating: RatingResponse.fromJson(json[r'rating'])!,
        tag: TagResponse.fromJson(json[r'tag'])!,
      );
    }
    return null;
  }

  static List<UserMetadataResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserMetadataResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserMetadataResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserMetadataResponse> mapFromJson(dynamic json) {
    final map = <String, UserMetadataResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserMetadataResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserMetadataResponse-objects as value to a dart map
  static Map<String, List<UserMetadataResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserMetadataResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserMetadataResponse.listFromJson(entry.value, growable: growable,);
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

