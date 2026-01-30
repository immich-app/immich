//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class VaultChangePinDto {
  /// Returns a new [VaultChangePinDto] instance.
  VaultChangePinDto({
    required this.currentPin,
    required this.newPin,
  });

  String currentPin;

  String newPin;

  @override
  bool operator ==(Object other) => identical(this, other) || other is VaultChangePinDto &&
    other.currentPin == currentPin &&
    other.newPin == newPin;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (currentPin.hashCode) +
    (newPin.hashCode);

  @override
  String toString() => 'VaultChangePinDto[currentPin=$currentPin, newPin=$newPin]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'currentPin'] = this.currentPin;
      json[r'newPin'] = this.newPin;
    return json;
  }

  /// Returns a new [VaultChangePinDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static VaultChangePinDto? fromJson(dynamic value) {
    upgradeDto(value, "VaultChangePinDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return VaultChangePinDto(
        currentPin: mapValueOfType<String>(json, r'currentPin')!,
        newPin: mapValueOfType<String>(json, r'newPin')!,
      );
    }
    return null;
  }

  static List<VaultChangePinDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <VaultChangePinDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = VaultChangePinDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, VaultChangePinDto> mapFromJson(dynamic json) {
    final map = <String, VaultChangePinDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = VaultChangePinDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of VaultChangePinDto-objects as value to a dart map
  static Map<String, List<VaultChangePinDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<VaultChangePinDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = VaultChangePinDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'currentPin',
    'newPin',
  };
}

