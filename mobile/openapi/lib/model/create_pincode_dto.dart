//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreatePincodeDto {
  /// Returns a new [CreatePincodeDto] instance.
  CreatePincodeDto({
    required this.pincode,
  });

  String pincode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreatePincodeDto &&
    other.pincode == pincode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (pincode.hashCode);

  @override
  String toString() => 'CreatePincodeDto[pincode=$pincode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'pincode'] = this.pincode;
    return json;
  }

  /// Returns a new [CreatePincodeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreatePincodeDto? fromJson(dynamic value) {
    upgradeDto(value, "CreatePincodeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreatePincodeDto(
        pincode: mapValueOfType<String>(json, r'pincode')!,
      );
    }
    return null;
  }

  static List<CreatePincodeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreatePincodeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreatePincodeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreatePincodeDto> mapFromJson(dynamic json) {
    final map = <String, CreatePincodeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreatePincodeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreatePincodeDto-objects as value to a dart map
  static Map<String, List<CreatePincodeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreatePincodeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreatePincodeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'pincode',
  };
}

