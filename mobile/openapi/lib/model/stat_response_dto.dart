//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class StatResponseDto {
  /// Returns a new [StatResponseDto] instance.
  StatResponseDto({
    required this.hidden,
    required this.visible,
    required this.total,
  });

  int hidden;

  int visible;

  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is StatResponseDto &&
     other.hidden == hidden &&
     other.visible == visible &&
     other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hidden.hashCode) +
    (visible.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'StatResponseDto[hidden=$hidden, visible=$visible, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hidden'] = this.hidden;
      json[r'visible'] = this.visible;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [StatResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static StatResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return StatResponseDto(
        hidden: mapValueOfType<int>(json, r'hidden')!,
        visible: mapValueOfType<int>(json, r'visible')!,
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<StatResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StatResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StatResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, StatResponseDto> mapFromJson(dynamic json) {
    final map = <String, StatResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = StatResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of StatResponseDto-objects as value to a dart map
  static Map<String, List<StatResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<StatResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = StatResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hidden',
    'visible',
    'total',
  };
}

