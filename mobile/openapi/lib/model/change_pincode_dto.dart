//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChangePincodeDto {
  /// Returns a new [ChangePincodeDto] instance.
  ChangePincodeDto({
    required this.newPincode,
    required this.pincode,
  });

  String newPincode;

  String pincode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChangePincodeDto &&
    other.newPincode == newPincode &&
    other.pincode == pincode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (newPincode.hashCode) +
    (pincode.hashCode);

  @override
  String toString() => 'ChangePincodeDto[newPincode=$newPincode, pincode=$pincode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'newPincode'] = this.newPincode;
      json[r'pincode'] = this.pincode;
    return json;
  }

  /// Returns a new [ChangePincodeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChangePincodeDto? fromJson(dynamic value) {
    upgradeDto(value, "ChangePincodeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ChangePincodeDto(
        newPincode: mapValueOfType<String>(json, r'newPincode')!,
        pincode: mapValueOfType<String>(json, r'pincode')!,
      );
    }
    return null;
  }

  static List<ChangePincodeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChangePincodeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChangePincodeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChangePincodeDto> mapFromJson(dynamic json) {
    final map = <String, ChangePincodeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChangePincodeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChangePincodeDto-objects as value to a dart map
  static Map<String, List<ChangePincodeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChangePincodeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChangePincodeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'newPincode',
    'pincode',
  };
}

