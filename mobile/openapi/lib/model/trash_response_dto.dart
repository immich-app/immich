//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TrashResponseDto {
  /// Returns a new [TrashResponseDto] instance.
  TrashResponseDto({
    required this.count,
  });

  int count;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TrashResponseDto &&
    other.count == count;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (count.hashCode);

  @override
  String toString() => 'TrashResponseDto[count=$count]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'count'] = this.count;
    return json;
  }

  /// Returns a new [TrashResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TrashResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TrashResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TrashResponseDto(
        count: mapValueOfType<int>(json, r'count')!,
      );
    }
    return null;
  }

  static List<TrashResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TrashResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TrashResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TrashResponseDto> mapFromJson(dynamic json) {
    final map = <String, TrashResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TrashResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TrashResponseDto-objects as value to a dart map
  static Map<String, List<TrashResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TrashResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TrashResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'count',
  };
}

