//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LikeStatusReponseDto {
  /// Returns a new [LikeStatusReponseDto] instance.
  LikeStatusReponseDto({
    required this.value,
  });

  bool value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LikeStatusReponseDto &&
     other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (value.hashCode);

  @override
  String toString() => 'LikeStatusReponseDto[value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [LikeStatusReponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LikeStatusReponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LikeStatusReponseDto(
        value: mapValueOfType<bool>(json, r'value')!,
      );
    }
    return null;
  }

  static List<LikeStatusReponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LikeStatusReponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LikeStatusReponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LikeStatusReponseDto> mapFromJson(dynamic json) {
    final map = <String, LikeStatusReponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LikeStatusReponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LikeStatusReponseDto-objects as value to a dart map
  static Map<String, List<LikeStatusReponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LikeStatusReponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LikeStatusReponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'value',
  };
}

