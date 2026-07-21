//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Integrity report type
enum IntegrityReport {
  untrackedFile._(r'untracked_file'),
  missingFile._(r'missing_file'),
  checksumMismatch._(r'checksum_mismatch'),
  ;

  /// Instantiate a new enum with the provided value.
  const IntegrityReport._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [IntegrityReport] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static IntegrityReport? fromJson(dynamic value) => IntegrityReportTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [IntegrityReport]
  /// that were successfully decoded from the passed [JSON][json].
  static List<IntegrityReport> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrityReport>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrityReport.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntegrityReport] to String,
/// and [decode] dynamic data back to [IntegrityReport].
class IntegrityReportTypeTransformer {
  factory IntegrityReportTypeTransformer() => _instance ??= const IntegrityReportTypeTransformer._();

  const IntegrityReportTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(IntegrityReport data) => data._value;

  /// Returns the instance of [IntegrityReport] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntegrityReport? decode(dynamic data, {bool allowNull = true}) {
    if (data is IntegrityReport) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'untracked_file': return IntegrityReport.untrackedFile;
        case r'missing_file': return IntegrityReport.missingFile;
        case r'checksum_mismatch': return IntegrityReport.checksumMismatch;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static IntegrityReportTypeTransformer? _instance;
}

