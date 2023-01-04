//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartInfoResponseDto {
  /// Returns a new [SmartInfoResponseDto] instance.
  SmartInfoResponseDto({
    this.id,
    this.tags = const [],
    this.objects = const [],
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? id;

  List<String>? tags;

  List<String>? objects;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartInfoResponseDto &&
     other.id == id &&
     other.tags == tags &&
     other.objects == objects;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id == null ? 0 : id!.hashCode) +
    (tags == null ? 0 : tags!.hashCode) +
    (objects == null ? 0 : objects!.hashCode);

  @override
  String toString() => 'SmartInfoResponseDto[id=$id, tags=$tags, objects=$objects]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.id != null) {
      json[r'id'] = this.id;
    } else {
      // json[r'id'] = null;
    }
    if (this.tags != null) {
      json[r'tags'] = this.tags;
    } else {
      // json[r'tags'] = null;
    }
    if (this.objects != null) {
      json[r'objects'] = this.objects;
    } else {
      // json[r'objects'] = null;
    }
    return json;
  }

  /// Returns a new [SmartInfoResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartInfoResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SmartInfoResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SmartInfoResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SmartInfoResponseDto(
        id: mapValueOfType<String>(json, r'id'),
        tags: json[r'tags'] is List
            ? (json[r'tags'] as List).cast<String>()
            : const [],
        objects: json[r'objects'] is List
            ? (json[r'objects'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<SmartInfoResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartInfoResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartInfoResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartInfoResponseDto> mapFromJson(dynamic json) {
    final map = <String, SmartInfoResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartInfoResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartInfoResponseDto-objects as value to a dart map
  static Map<String, List<SmartInfoResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartInfoResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartInfoResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

