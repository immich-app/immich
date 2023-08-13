//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateRuleDto {
  /// Returns a new [CreateRuleDto] instance.
  CreateRuleDto({
    required this.albumId,
    required this.key,
    required this.value,
  });

  String albumId;

  RuleKey key;

  String value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateRuleDto &&
     other.albumId == albumId &&
     other.key == key &&
     other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (key.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'CreateRuleDto[albumId=$albumId, key=$key, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
      json[r'key'] = this.key;
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [CreateRuleDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateRuleDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateRuleDto(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        key: RuleKey.fromJson(json[r'key'])!,
        value: mapValueOfType<String>(json, r'value')!,
      );
    }
    return null;
  }

  static List<CreateRuleDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateRuleDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateRuleDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateRuleDto> mapFromJson(dynamic json) {
    final map = <String, CreateRuleDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateRuleDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateRuleDto-objects as value to a dart map
  static Map<String, List<CreateRuleDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateRuleDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateRuleDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'key',
    'value',
  };
}

