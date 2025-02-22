//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncEntityType {
  /// Instantiate a new enum with the provided [value].
  const SyncEntityType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const userV1 = SyncEntityType._(r'UserV1');
  static const userDeleteV1 = SyncEntityType._(r'UserDeleteV1');

  /// List of all possible values in this [enum][SyncEntityType].
  static const values = <SyncEntityType>[
    userV1,
    userDeleteV1,
  ];

  static SyncEntityType? fromJson(dynamic value) => SyncEntityTypeTypeTransformer().decode(value);

  static List<SyncEntityType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncEntityType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncEntityType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncEntityType] to String,
/// and [decode] dynamic data back to [SyncEntityType].
class SyncEntityTypeTypeTransformer {
  factory SyncEntityTypeTypeTransformer() => _instance ??= const SyncEntityTypeTypeTransformer._();

  const SyncEntityTypeTypeTransformer._();

  String encode(SyncEntityType data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncEntityType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncEntityType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UserV1': return SyncEntityType.userV1;
        case r'UserDeleteV1': return SyncEntityType.userDeleteV1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncEntityTypeTypeTransformer] instance.
  static SyncEntityTypeTypeTransformer? _instance;
}

