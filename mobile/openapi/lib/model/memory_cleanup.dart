//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MemoryCleanup {
  /// Instantiate a new enum with the provided [value].
  const MemoryCleanup._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const memoryCleanup = MemoryCleanup._(r'MemoryCleanup');

  /// List of all possible values in this [enum][MemoryCleanup].
  static const values = <MemoryCleanup>[
    memoryCleanup,
  ];

  static MemoryCleanup? fromJson(dynamic value) => MemoryCleanupTypeTransformer().decode(value);

  static List<MemoryCleanup> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryCleanup>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryCleanup.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MemoryCleanup] to String,
/// and [decode] dynamic data back to [MemoryCleanup].
class MemoryCleanupTypeTransformer {
  factory MemoryCleanupTypeTransformer() => _instance ??= const MemoryCleanupTypeTransformer._();

  const MemoryCleanupTypeTransformer._();

  String encode(MemoryCleanup data) => data.value;

  /// Decodes a [dynamic value][data] to a MemoryCleanup.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MemoryCleanup? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'MemoryCleanup': return MemoryCleanup.memoryCleanup;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MemoryCleanupTypeTransformer] instance.
  static MemoryCleanupTypeTransformer? _instance;
}

