//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class VaultStatusResponseDto {
  /// Returns a new [VaultStatusResponseDto] instance.
  VaultStatusResponseDto({
    required this.hasVault,
    required this.isUnlocked,
    required this.vaultVersion,
  });

  bool hasVault;

  bool isUnlocked;

  int? vaultVersion;

  @override
  bool operator ==(Object other) => identical(this, other) || other is VaultStatusResponseDto &&
    other.hasVault == hasVault &&
    other.isUnlocked == isUnlocked &&
    other.vaultVersion == vaultVersion;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hasVault.hashCode) +
    (isUnlocked.hashCode) +
    (vaultVersion == null ? 0 : vaultVersion!.hashCode);

  @override
  String toString() => 'VaultStatusResponseDto[hasVault=$hasVault, isUnlocked=$isUnlocked, vaultVersion=$vaultVersion]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hasVault'] = this.hasVault;
      json[r'isUnlocked'] = this.isUnlocked;
    if (this.vaultVersion != null) {
      json[r'vaultVersion'] = this.vaultVersion;
    } else {
    //  json[r'vaultVersion'] = null;
    }
    return json;
  }

  /// Returns a new [VaultStatusResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static VaultStatusResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "VaultStatusResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return VaultStatusResponseDto(
        hasVault: mapValueOfType<bool>(json, r'hasVault')!,
        isUnlocked: mapValueOfType<bool>(json, r'isUnlocked')!,
        vaultVersion: mapValueOfType<int>(json, r'vaultVersion'),
      );
    }
    return null;
  }

  static List<VaultStatusResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <VaultStatusResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = VaultStatusResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, VaultStatusResponseDto> mapFromJson(dynamic json) {
    final map = <String, VaultStatusResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = VaultStatusResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of VaultStatusResponseDto-objects as value to a dart map
  static Map<String, List<VaultStatusResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<VaultStatusResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = VaultStatusResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hasVault',
    'isUnlocked',
    'vaultVersion',
  };
}

