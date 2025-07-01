//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PinCodeChangeDto {
  /// Returns a new [PinCodeChangeDto] instance.
  PinCodeChangeDto({
    required this.newPinCode,
    this.password,
    this.pinCode,
  });

  String newPinCode;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? pinCode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PinCodeChangeDto &&
    other.newPinCode == newPinCode &&
    other.password == password &&
    other.pinCode == pinCode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (newPinCode.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (pinCode == null ? 0 : pinCode!.hashCode);

  @override
  String toString() => 'PinCodeChangeDto[newPinCode=$newPinCode, password=$password, pinCode=$pinCode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'newPinCode'] = this.newPinCode;
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
    if (this.pinCode != null) {
      json[r'pinCode'] = this.pinCode;
    } else {
    //  json[r'pinCode'] = null;
    }
    return json;
  }

  /// Returns a new [PinCodeChangeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PinCodeChangeDto? fromJson(dynamic value) {
    upgradeDto(value, "PinCodeChangeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PinCodeChangeDto(
        newPinCode: mapValueOfType<String>(json, r'newPinCode')!,
        password: mapValueOfType<String>(json, r'password'),
        pinCode: mapValueOfType<String>(json, r'pinCode'),
      );
    }
    return null;
  }

  static List<PinCodeChangeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PinCodeChangeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PinCodeChangeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PinCodeChangeDto> mapFromJson(dynamic json) {
    final map = <String, PinCodeChangeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PinCodeChangeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PinCodeChangeDto-objects as value to a dart map
  static Map<String, List<PinCodeChangeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PinCodeChangeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PinCodeChangeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'newPinCode',
  };
}

