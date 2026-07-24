//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OnboardingStatusResponseDto {
  /// Returns a new [OnboardingStatusResponseDto] instance.
  OnboardingStatusResponseDto({
    this.error = const Optional.absent(),
    required this.hasBackend,
    required this.hasBackup,
    required this.hasOnboardedKey,
    required this.hasSchedule,
    required this.hasSkippedExtraConfig,
    required this.hasTelemetry,
    required this.status,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> error;

  bool hasBackend;

  bool hasBackup;

  bool hasOnboardedKey;

  bool hasSchedule;

  bool hasSkippedExtraConfig;

  TelemetryLevel hasTelemetry;

  BootstrapStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OnboardingStatusResponseDto &&
    other.error == error &&
    other.hasBackend == hasBackend &&
    other.hasBackup == hasBackup &&
    other.hasOnboardedKey == hasOnboardedKey &&
    other.hasSchedule == hasSchedule &&
    other.hasSkippedExtraConfig == hasSkippedExtraConfig &&
    other.hasTelemetry == hasTelemetry &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (error == null ? 0 : error!.hashCode) +
    (hasBackend.hashCode) +
    (hasBackup.hashCode) +
    (hasOnboardedKey.hashCode) +
    (hasSchedule.hashCode) +
    (hasSkippedExtraConfig.hashCode) +
    (hasTelemetry.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'OnboardingStatusResponseDto[error=$error, hasBackend=$hasBackend, hasBackup=$hasBackup, hasOnboardedKey=$hasOnboardedKey, hasSchedule=$hasSchedule, hasSkippedExtraConfig=$hasSkippedExtraConfig, hasTelemetry=$hasTelemetry, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.error.isPresent) {
      final value = this.error.value;
      json[r'error'] = value;
    }
      json[r'hasBackend'] = this.hasBackend;
      json[r'hasBackup'] = this.hasBackup;
      json[r'hasOnboardedKey'] = this.hasOnboardedKey;
      json[r'hasSchedule'] = this.hasSchedule;
      json[r'hasSkippedExtraConfig'] = this.hasSkippedExtraConfig;
      json[r'hasTelemetry'] = this.hasTelemetry;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [OnboardingStatusResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OnboardingStatusResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "OnboardingStatusResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OnboardingStatusResponseDto(
        error: json.containsKey(r'error') ? Optional.present(mapValueOfType<String>(json, r'error')) : const Optional.absent(),
        hasBackend: mapValueOfType<bool>(json, r'hasBackend')!,
        hasBackup: mapValueOfType<bool>(json, r'hasBackup')!,
        hasOnboardedKey: mapValueOfType<bool>(json, r'hasOnboardedKey')!,
        hasSchedule: mapValueOfType<bool>(json, r'hasSchedule')!,
        hasSkippedExtraConfig: mapValueOfType<bool>(json, r'hasSkippedExtraConfig')!,
        hasTelemetry: TelemetryLevel.fromJson(json[r'hasTelemetry'])!,
        status: BootstrapStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<OnboardingStatusResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OnboardingStatusResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OnboardingStatusResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OnboardingStatusResponseDto> mapFromJson(dynamic json) {
    final map = <String, OnboardingStatusResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OnboardingStatusResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OnboardingStatusResponseDto-objects as value to a dart map
  static Map<String, List<OnboardingStatusResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OnboardingStatusResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OnboardingStatusResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hasBackend',
    'hasBackup',
    'hasOnboardedKey',
    'hasSchedule',
    'hasSkippedExtraConfig',
    'hasTelemetry',
    'status',
  };
}

