//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Asset sorting property
enum AssetOrderBy {
  takenAt._(r'takenAt'),
  createdAt._(r'createdAt'),
  ;

  /// Instantiate a new enum with the provided value.
  const AssetOrderBy._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [AssetOrderBy] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static AssetOrderBy? fromJson(dynamic value) => AssetOrderByTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [AssetOrderBy]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(AssetOrderBy data) => data._value;

  /// Returns the instance of [AssetOrderBy] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetOrderBy? decode(dynamic data, {bool allowNull = true}) {
    if (data is AssetOrderBy) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'takenAt': return AssetOrderBy.takenAt;
        case r'createdAt': return AssetOrderBy.createdAt;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static AssetOrderByTypeTransformer? _instance;
}

