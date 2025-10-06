//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetOrderBy {
  /// Instantiate a new enum with the provided [value].
  const AssetOrderBy._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const ADDED = AssetOrderBy._(r'DATE_ADDED');
  static const DELETED = AssetOrderBy._(r'DATE_DELETED');
  static const TAKEN = AssetOrderBy._(r'DATE_TAKEN');

  /// List of all possible values in this [enum][AssetOrderBy].
  static const values = <AssetOrderBy>[
    ADDED,
    DELETED,
    TAKEN,
  ];

  static AssetOrderBy? fromJson(dynamic value) => AssetOrderByTypeTransformer().decode(value);

  static List<AssetOrderBy> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetOrderBy>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetOrderBy.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetOrderBy] to String,
/// and [decode] dynamic data back to [AssetOrderBy].
class AssetOrderByTypeTransformer {
  factory AssetOrderByTypeTransformer() => _instance ??= const AssetOrderByTypeTransformer._();

  const AssetOrderByTypeTransformer._();

  String encode(AssetOrderBy data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetOrderBy.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetOrderBy? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'DATE_ADDED': return AssetOrderBy.ADDED;
        case r'DATE_DELETED': return AssetOrderBy.DELETED;
        case r'DATE_TAKEN': return AssetOrderBy.TAKEN;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetOrderByTypeTransformer] instance.
  static AssetOrderByTypeTransformer? _instance;
}

