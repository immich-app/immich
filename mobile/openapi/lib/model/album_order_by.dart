//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Album sort mode
class AlbumOrderBy {
  /// Instantiate a new enum with the provided [value].
  const AlbumOrderBy._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const date = AlbumOrderBy._(r'date');
  static const custom = AlbumOrderBy._(r'custom');

  /// List of all possible values in this [enum][AlbumOrderBy].
  static const values = <AlbumOrderBy>[
    date,
    custom,
  ];

  static AlbumOrderBy? fromJson(dynamic value) => AlbumOrderByTypeTransformer().decode(value);

  static List<AlbumOrderBy> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumOrderBy>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumOrderBy.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumOrderBy] to String,
/// and [decode] dynamic data back to [AlbumOrderBy].
class AlbumOrderByTypeTransformer {
  factory AlbumOrderByTypeTransformer() => _instance ??= const AlbumOrderByTypeTransformer._();

  const AlbumOrderByTypeTransformer._();

  String encode(AlbumOrderBy data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumOrderBy.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumOrderBy? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'date': return AlbumOrderBy.date;
        case r'custom': return AlbumOrderBy.custom;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumOrderByTypeTransformer] instance.
  static AlbumOrderByTypeTransformer? _instance;
}

