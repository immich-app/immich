//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PinCodeSetupDto {
  /// Returns a new [PinCodeSetupDto] instance.
  PinCodeSetupDto({
    required this.pinCode,
  });

  String pinCode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PinCodeSetupDto &&
    other.pinCode == pinCode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (pinCode.hashCode);

  @override
  String toString() => 'PinCodeSetupDto[pinCode=$pinCode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'pinCode'] = this.pinCode;
    return json;
  }

  /// Returns a new [PinCodeSetupDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PinCodeSetupDto? fromJson(dynamic value) {
    upgradeDto(value, "PinCodeSetupDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PinCodeSetupDto(
        pinCode: mapValueOfType<String>(json, r'pinCode')!,
      );
    }
    return null;
  }

  static List<PinCodeSetupDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PinCodeSetupDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PinCodeSetupDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PinCodeSetupDto> mapFromJson(dynamic json) {
    final map = <String, PinCodeSetupDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PinCodeSetupDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PinCodeSetupDto-objects as value to a dart map
  static Map<String, List<PinCodeSetupDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PinCodeSetupDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PinCodeSetupDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'pinCode',
  };
}

