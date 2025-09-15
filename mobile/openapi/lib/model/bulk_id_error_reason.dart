//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class BulkIdErrorReason {
  /// Instantiate a new enum with the provided [value].
  const BulkIdErrorReason._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = BulkIdErrorReason._(r'duplicate');
  static const noPermission = BulkIdErrorReason._(r'no_permission');
  static const notFound = BulkIdErrorReason._(r'not_found');
  static const unknown = BulkIdErrorReason._(r'unknown');

  /// List of all possible values in this [enum][BulkIdErrorReason].
  static const values = <BulkIdErrorReason>[
    duplicate,
    noPermission,
    notFound,
    unknown,
  ];

  static BulkIdErrorReason? fromJson(dynamic value) => BulkIdErrorReasonTypeTransformer().decode(value);

  static List<BulkIdErrorReason> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BulkIdErrorReason>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BulkIdErrorReason.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BulkIdErrorReason] to String,
/// and [decode] dynamic data back to [BulkIdErrorReason].
class BulkIdErrorReasonTypeTransformer {
  factory BulkIdErrorReasonTypeTransformer() => _instance ??= const BulkIdErrorReasonTypeTransformer._();

  const BulkIdErrorReasonTypeTransformer._();

  String encode(BulkIdErrorReason data) => data.value;

  /// Decodes a [dynamic value][data] to a BulkIdErrorReason.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BulkIdErrorReason? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'duplicate': return BulkIdErrorReason.duplicate;
        case r'no_permission': return BulkIdErrorReason.noPermission;
        case r'not_found': return BulkIdErrorReason.notFound;
        case r'unknown': return BulkIdErrorReason.unknown;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [BulkIdErrorReasonTypeTransformer] instance.
  static BulkIdErrorReasonTypeTransformer? _instance;
}

