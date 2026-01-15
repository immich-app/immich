//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UploadStrategy {
  /// Instantiate a new enum with the provided [value].
  const UploadStrategy._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const localFirst = UploadStrategy._(r'local-first');
  static const s3First = UploadStrategy._(r's3-first');

  /// List of all possible values in this [enum][UploadStrategy].
  static const values = <UploadStrategy>[
    localFirst,
    s3First,
  ];

  static UploadStrategy? fromJson(dynamic value) => UploadStrategyTypeTransformer().decode(value);

  static List<UploadStrategy> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UploadStrategy>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UploadStrategy.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UploadStrategy] to String,
/// and [decode] dynamic data back to [UploadStrategy].
class UploadStrategyTypeTransformer {
  factory UploadStrategyTypeTransformer() => _instance ??= const UploadStrategyTypeTransformer._();

  const UploadStrategyTypeTransformer._();

  String encode(UploadStrategy data) => data.value;

  /// Decodes a [dynamic value][data] to a UploadStrategy.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UploadStrategy? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'local-first': return UploadStrategy.localFirst;
        case r's3-first': return UploadStrategy.s3First;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UploadStrategyTypeTransformer] instance.
  static UploadStrategyTypeTransformer? _instance;
}

