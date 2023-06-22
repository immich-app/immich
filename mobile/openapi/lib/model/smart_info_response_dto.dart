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
    this.tags = const [],
    this.objects = const [],
  });

  List<String>? tags;

  List<String>? objects;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartInfoResponseDto &&
     other.tags == tags &&
     other.objects == objects;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (tags == null ? 0 : tags!.hashCode) +
    (objects == null ? 0 : objects!.hashCode);

  @override
  String toString() => 'SmartInfoResponseDto[tags=$tags, objects=$objects]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
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
          // assert(json[key] != null, 'Required key "SmartInfoResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SmartInfoResponseDto(
        tags: json[r'tags'] is Iterable
            ? (json[r'tags'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        objects: json[r'objects'] is Iterable
            ? (json[r'objects'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<SmartInfoResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
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
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartInfoResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

