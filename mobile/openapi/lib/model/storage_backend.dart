//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class StorageBackend {
  /// Instantiate a new enum with the provided [value].
  const StorageBackend._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const local = StorageBackend._(r'local');
  static const s3 = StorageBackend._(r's3');

  /// List of all possible values in this [enum][StorageBackend].
  static const values = <StorageBackend>[
    local,
    s3,
  ];

  static StorageBackend? fromJson(dynamic value) => StorageBackendTypeTransformer().decode(value);

  static List<StorageBackend> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StorageBackend>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StorageBackend.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [StorageBackend] to String,
/// and [decode] dynamic data back to [StorageBackend].
class StorageBackendTypeTransformer {
  factory StorageBackendTypeTransformer() => _instance ??= const StorageBackendTypeTransformer._();

  const StorageBackendTypeTransformer._();

  String encode(StorageBackend data) => data.value;

  /// Decodes a [dynamic value][data] to a StorageBackend.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  StorageBackend? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'local': return StorageBackend.local;
        case r's3': return StorageBackend.s3;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [StorageBackendTypeTransformer] instance.
  static StorageBackendTypeTransformer? _instance;
}

