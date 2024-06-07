//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AdminOnboardingUpdateDto {
  /// Returns a new [AdminOnboardingUpdateDto] instance.
  AdminOnboardingUpdateDto({
    required this.isOnboarded,
  });

  bool isOnboarded;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AdminOnboardingUpdateDto &&
    other.isOnboarded == isOnboarded;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isOnboarded.hashCode);

  @override
  String toString() => 'AdminOnboardingUpdateDto[isOnboarded=$isOnboarded]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'isOnboarded'] = this.isOnboarded;
    return json;
  }

  /// Returns a new [AdminOnboardingUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AdminOnboardingUpdateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AdminOnboardingUpdateDto(
        isOnboarded: mapValueOfType<bool>(json, r'isOnboarded')!,
      );
    }
    return null;
  }

  static List<AdminOnboardingUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AdminOnboardingUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AdminOnboardingUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AdminOnboardingUpdateDto> mapFromJson(dynamic json) {
    final map = <String, AdminOnboardingUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AdminOnboardingUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AdminOnboardingUpdateDto-objects as value to a dart map
  static Map<String, List<AdminOnboardingUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AdminOnboardingUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AdminOnboardingUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isOnboarded',
  };
}

