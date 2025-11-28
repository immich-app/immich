//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceIntegrityReportSummaryResponseDto {
  /// Returns a new [MaintenanceIntegrityReportSummaryResponseDto] instance.
  MaintenanceIntegrityReportSummaryResponseDto({
    required this.checksumMismatch,
    required this.missingFile,
    required this.orphanFile,
  });

  int checksumMismatch;

  int missingFile;

  int orphanFile;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceIntegrityReportSummaryResponseDto &&
    other.checksumMismatch == checksumMismatch &&
    other.missingFile == missingFile &&
    other.orphanFile == orphanFile;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksumMismatch.hashCode) +
    (missingFile.hashCode) +
    (orphanFile.hashCode);

  @override
  String toString() => 'MaintenanceIntegrityReportSummaryResponseDto[checksumMismatch=$checksumMismatch, missingFile=$missingFile, orphanFile=$orphanFile]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum_mismatch'] = this.checksumMismatch;
      json[r'missing_file'] = this.missingFile;
      json[r'orphan_file'] = this.orphanFile;
    return json;
  }

  /// Returns a new [MaintenanceIntegrityReportSummaryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceIntegrityReportSummaryResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceIntegrityReportSummaryResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceIntegrityReportSummaryResponseDto(
        checksumMismatch: mapValueOfType<int>(json, r'checksum_mismatch')!,
        missingFile: mapValueOfType<int>(json, r'missing_file')!,
        orphanFile: mapValueOfType<int>(json, r'orphan_file')!,
      );
    }
    return null;
  }

  static List<MaintenanceIntegrityReportSummaryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceIntegrityReportSummaryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceIntegrityReportSummaryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceIntegrityReportSummaryResponseDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceIntegrityReportSummaryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceIntegrityReportSummaryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceIntegrityReportSummaryResponseDto-objects as value to a dart map
  static Map<String, List<MaintenanceIntegrityReportSummaryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceIntegrityReportSummaryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceIntegrityReportSummaryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum_mismatch',
    'missing_file',
    'orphan_file',
  };
}

