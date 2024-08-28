//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MetadataUpdate {
  /// Returns a new [MetadataUpdate] instance.
  MetadataUpdate({
    this.folder,
    this.memory,
    this.people,
    this.rating,
    this.tag,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  FolderUpdate? folder;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  MemoryUpdate? memory;

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
  RatingUpdate? rating;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  TagUpdate? tag;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MetadataUpdate &&
    other.folder == folder &&
    other.memory == memory &&
    other.people == people &&
    other.rating == rating &&
    other.tag == tag;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (folder == null ? 0 : folder!.hashCode) +
    (memory == null ? 0 : memory!.hashCode) +
    (people == null ? 0 : people!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (tag == null ? 0 : tag!.hashCode);

  @override
  String toString() => 'MetadataUpdate[folder=$folder, memory=$memory, people=$people, rating=$rating, tag=$tag]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.folder != null) {
      json[r'folder'] = this.folder;
    } else {
    //  json[r'folder'] = null;
    }
    if (this.memory != null) {
      json[r'memory'] = this.memory;
    } else {
    //  json[r'memory'] = null;
    }
    if (this.people != null) {
      json[r'people'] = this.people;
    } else {
    //  json[r'people'] = null;
    }
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
    }
    if (this.tag != null) {
      json[r'tag'] = this.tag;
    } else {
    //  json[r'tag'] = null;
    }
    return json;
  }

  /// Returns a new [MetadataUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MetadataUpdate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MetadataUpdate(
        folder: FolderUpdate.fromJson(json[r'folder']),
        memory: MemoryUpdate.fromJson(json[r'memory']),
        people: PeopleUpdate.fromJson(json[r'people']),
        rating: RatingUpdate.fromJson(json[r'rating']),
        tag: TagUpdate.fromJson(json[r'tag']),
      );
    }
    return null;
  }

  static List<MetadataUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MetadataUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MetadataUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MetadataUpdate> mapFromJson(dynamic json) {
    final map = <String, MetadataUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MetadataUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MetadataUpdate-objects as value to a dart map
  static Map<String, List<MetadataUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MetadataUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MetadataUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

