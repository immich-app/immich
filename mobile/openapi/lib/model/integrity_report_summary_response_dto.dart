//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntegrityReportSummaryResponseDto {
  /// Returns a new [IntegrityReportSummaryResponseDto] instance.
  IntegrityReportSummaryResponseDto({
    required this.checksumMismatch,
    required this.missingFile,
    required this.untrackedFile,
  });

  int checksumMismatch;

  int missingFile;

  int untrackedFile;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntegrityReportSummaryResponseDto &&
    other.checksumMismatch == checksumMismatch &&
    other.missingFile == missingFile &&
    other.untrackedFile == untrackedFile;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksumMismatch.hashCode) +
    (missingFile.hashCode) +
    (untrackedFile.hashCode);

  @override
  String toString() => 'IntegrityReportSummaryResponseDto[checksumMismatch=$checksumMismatch, missingFile=$missingFile, untrackedFile=$untrackedFile]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum_mismatch'] = this.checksumMismatch;
      json[r'missing_file'] = this.missingFile;
      json[r'untracked_file'] = this.untrackedFile;
    return json;
  }

  /// Returns a new [IntegrityReportSummaryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntegrityReportSummaryResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "IntegrityReportSummaryResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IntegrityReportSummaryResponseDto(
        checksumMismatch: mapValueOfType<int>(json, r'checksum_mismatch')!,
        missingFile: mapValueOfType<int>(json, r'missing_file')!,
        untrackedFile: mapValueOfType<int>(json, r'untracked_file')!,
      );
    }
    return null;
  }

  static List<IntegrityReportSummaryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrityReportSummaryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrityReportSummaryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntegrityReportSummaryResponseDto> mapFromJson(dynamic json) {
    final map = <String, IntegrityReportSummaryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntegrityReportSummaryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntegrityReportSummaryResponseDto-objects as value to a dart map
  static Map<String, List<IntegrityReportSummaryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntegrityReportSummaryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntegrityReportSummaryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum_mismatch',
    'missing_file',
    'untracked_file',
  };
}

