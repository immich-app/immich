//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class BackendType {
  /// Instantiate a new enum with the provided [value].
  const BackendType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const yucca = BackendType._(r'yucca');
  static const local = BackendType._(r'local');
  static const s3 = BackendType._(r's3');

  /// List of all possible values in this [enum][BackendType].
  static const values = <BackendType>[
    yucca,
    local,
    s3,
  ];

  static BackendType? fromJson(dynamic value) => BackendTypeTypeTransformer().decode(value);

  static List<BackendType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BackendType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BackendType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BackendType] to String,
/// and [decode] dynamic data back to [BackendType].
class BackendTypeTypeTransformer {
  factory BackendTypeTypeTransformer() => _instance ??= const BackendTypeTypeTransformer._();

  const BackendTypeTypeTransformer._();

  String encode(BackendType data) => data.value;

  /// Decodes a [dynamic value][data] to a BackendType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BackendType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'yucca': return BackendType.yucca;
        case r'local': return BackendType.local;
        case r's3': return BackendType.s3;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [BackendTypeTypeTransformer] instance.
  static BackendTypeTypeTransformer? _instance;
}

