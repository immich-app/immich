//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OnboardingResponseDto {
  /// Returns a new [OnboardingResponseDto] instance.
  OnboardingResponseDto({
    required this.isOnboarded,
  });

  bool isOnboarded;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OnboardingResponseDto &&
    other.isOnboarded == isOnboarded;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isOnboarded.hashCode);

  @override
  String toString() => 'OnboardingResponseDto[isOnboarded=$isOnboarded]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'isOnboarded'] = this.isOnboarded;
    return json;
  }

  /// Returns a new [OnboardingResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OnboardingResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "OnboardingResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OnboardingResponseDto(
        isOnboarded: mapValueOfType<bool>(json, r'isOnboarded')!,
      );
    }
    return null;
  }

  static List<OnboardingResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OnboardingResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OnboardingResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OnboardingResponseDto> mapFromJson(dynamic json) {
    final map = <String, OnboardingResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OnboardingResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OnboardingResponseDto-objects as value to a dart map
  static Map<String, List<OnboardingResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OnboardingResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OnboardingResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isOnboarded',
  };
}

