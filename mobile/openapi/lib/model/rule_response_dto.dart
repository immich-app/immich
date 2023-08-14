//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RuleResponseDto {
  /// Returns a new [RuleResponseDto] instance.
  RuleResponseDto({
    required this.id,
    required this.key,
    required this.ownerId,
    required this.value,
  });

  String id;

  RuleKey key;

  String ownerId;

  String value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RuleResponseDto &&
     other.id == id &&
     other.key == key &&
     other.ownerId == ownerId &&
     other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (key.hashCode) +
    (ownerId.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'RuleResponseDto[id=$id, key=$key, ownerId=$ownerId, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'key'] = this.key;
      json[r'ownerId'] = this.ownerId;
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [RuleResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RuleResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RuleResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        key: RuleKey.fromJson(json[r'key'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        value: mapValueOfType<String>(json, r'value')!,
      );
    }
    return null;
  }

  static List<RuleResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RuleResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RuleResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RuleResponseDto> mapFromJson(dynamic json) {
    final map = <String, RuleResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RuleResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RuleResponseDto-objects as value to a dart map
  static Map<String, List<RuleResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RuleResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RuleResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'key',
    'ownerId',
    'value',
  };
}

