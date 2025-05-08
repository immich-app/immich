//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ResetPincodeDto {
  /// Returns a new [ResetPincodeDto] instance.
  ResetPincodeDto({
    required this.userId,
  });

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ResetPincodeDto &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userId.hashCode);

  @override
  String toString() => 'ResetPincodeDto[userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [ResetPincodeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ResetPincodeDto? fromJson(dynamic value) {
    upgradeDto(value, "ResetPincodeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ResetPincodeDto(
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<ResetPincodeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ResetPincodeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ResetPincodeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ResetPincodeDto> mapFromJson(dynamic json) {
    final map = <String, ResetPincodeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ResetPincodeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ResetPincodeDto-objects as value to a dart map
  static Map<String, List<ResetPincodeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ResetPincodeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ResetPincodeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userId',
  };
}

