//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class IntegrityReportType {
  /// Instantiate a new enum with the provided [value].
  const IntegrityReportType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const orphanFile = IntegrityReportType._(r'orphan_file');
  static const missingFile = IntegrityReportType._(r'missing_file');
  static const checksumMismatch = IntegrityReportType._(r'checksum_mismatch');

  /// List of all possible values in this [enum][IntegrityReportType].
  static const values = <IntegrityReportType>[
    orphanFile,
    missingFile,
    checksumMismatch,
  ];

  static IntegrityReportType? fromJson(dynamic value) => IntegrityReportTypeTypeTransformer().decode(value);

  static List<IntegrityReportType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrityReportType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrityReportType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntegrityReportType] to String,
/// and [decode] dynamic data back to [IntegrityReportType].
class IntegrityReportTypeTypeTransformer {
  factory IntegrityReportTypeTypeTransformer() => _instance ??= const IntegrityReportTypeTypeTransformer._();

  const IntegrityReportTypeTypeTransformer._();

  String encode(IntegrityReportType data) => data.value;

  /// Decodes a [dynamic value][data] to a IntegrityReportType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntegrityReportType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'orphan_file': return IntegrityReportType.orphanFile;
        case r'missing_file': return IntegrityReportType.missingFile;
        case r'checksum_mismatch': return IntegrityReportType.checksumMismatch;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [IntegrityReportTypeTypeTransformer] instance.
  static IntegrityReportTypeTypeTransformer? _instance;
}

