//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartInfoResponseDto {
  /// Returns a new [SmartInfoResponseDto] instance.
  SmartInfoResponseDto({
    this.objects = const [],
    this.tags = const [],
  });

  List<String>? objects;

  List<String>? tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartInfoResponseDto &&
    _deepEquality.equals(other.objects, objects) &&
    _deepEquality.equals(other.tags, tags);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (objects == null ? 0 : objects!.hashCode) +
    (tags == null ? 0 : tags!.hashCode);

  @override
  String toString() => 'SmartInfoResponseDto[objects=$objects, tags=$tags]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.objects != null) {
      json[r'objects'] = this.objects;
    } else {
    //  json[r'objects'] = null;
    }
    if (this.tags != null) {
      json[r'tags'] = this.tags;
    } else {
    //  json[r'tags'] = null;
    }
    return json;
  }

  /// Returns a new [SmartInfoResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartInfoResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartInfoResponseDto(
        objects: json[r'objects'] is Iterable
            ? (json[r'objects'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        tags: json[r'tags'] is Iterable
            ? (json[r'tags'] as Iterable).cast<String>().toList(growable: false)
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

