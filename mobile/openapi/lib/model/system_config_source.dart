//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SystemConfigSource {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigSource._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const DEFAULT = SystemConfigSource._(r'DEFAULT');
  static const DATABASE = SystemConfigSource._(r'DATABASE');
  static const ENVIRONMENT = SystemConfigSource._(r'ENVIRONMENT');

  /// List of all possible values in this [enum][SystemConfigSource].
  static const values = <SystemConfigSource>[
    DEFAULT,
    DATABASE,
    ENVIRONMENT,
  ];

  static SystemConfigSource? fromJson(dynamic value) => SystemConfigSourceTypeTransformer().decode(value);

  static List<SystemConfigSource>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigSource>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigSource.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigSource] to String,
/// and [decode] dynamic data back to [SystemConfigSource].
class SystemConfigSourceTypeTransformer {
  factory SystemConfigSourceTypeTransformer() => _instance ??= const SystemConfigSourceTypeTransformer._();

  const SystemConfigSourceTypeTransformer._();

  String encode(SystemConfigSource data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigSource.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigSource? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'DEFAULT': return SystemConfigSource.DEFAULT;
        case r'DATABASE': return SystemConfigSource.DATABASE;
        case r'ENVIRONMENT': return SystemConfigSource.ENVIRONMENT;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigSourceTypeTransformer] instance.
  static SystemConfigSourceTypeTransformer? _instance;
}

