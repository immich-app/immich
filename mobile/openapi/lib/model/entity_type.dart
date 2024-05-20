//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class EntityType {
  /// Instantiate a new enum with the provided [value].
  const EntityType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const ASSET = EntityType._(r'ASSET');
  static const ALBUM = EntityType._(r'ALBUM');

  /// List of all possible values in this [enum][EntityType].
  static const values = <EntityType>[
    ASSET,
    ALBUM,
  ];

  static EntityType? fromJson(dynamic value) => EntityTypeTypeTransformer().decode(value);

  static List<EntityType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EntityType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EntityType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [EntityType] to String,
/// and [decode] dynamic data back to [EntityType].
class EntityTypeTypeTransformer {
  factory EntityTypeTypeTransformer() => _instance ??= const EntityTypeTypeTransformer._();

  const EntityTypeTypeTransformer._();

  String encode(EntityType data) => data.value;

  /// Decodes a [dynamic value][data] to a EntityType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  EntityType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'ASSET': return EntityType.ASSET;
        case r'ALBUM': return EntityType.ALBUM;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [EntityTypeTypeTransformer] instance.
  static EntityTypeTypeTransformer? _instance;
}

