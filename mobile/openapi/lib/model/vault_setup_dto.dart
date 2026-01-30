//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class VaultSetupDto {
  /// Returns a new [VaultSetupDto] instance.
  VaultSetupDto({
    required this.pin,
  });

  String pin;

  @override
  bool operator ==(Object other) => identical(this, other) || other is VaultSetupDto &&
    other.pin == pin;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (pin.hashCode);

  @override
  String toString() => 'VaultSetupDto[pin=$pin]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'pin'] = this.pin;
    return json;
  }

  /// Returns a new [VaultSetupDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static VaultSetupDto? fromJson(dynamic value) {
    upgradeDto(value, "VaultSetupDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return VaultSetupDto(
        pin: mapValueOfType<String>(json, r'pin')!,
      );
    }
    return null;
  }

  static List<VaultSetupDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <VaultSetupDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = VaultSetupDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, VaultSetupDto> mapFromJson(dynamic json) {
    final map = <String, VaultSetupDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = VaultSetupDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of VaultSetupDto-objects as value to a dart map
  static Map<String, List<VaultSetupDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<VaultSetupDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = VaultSetupDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'pin',
  };
}

