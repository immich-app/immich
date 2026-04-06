//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Field to sort assets by (date or size)
class AssetSortField {
  /// Instantiate a new enum with the provided [value].
  const AssetSortField._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const date = AssetSortField._(r'date');
  static const size = AssetSortField._(r'size');

  /// List of all possible values in this [enum][AssetSortField].
  static const values = <AssetSortField>[
    date,
    size,
  ];

  static AssetSortField? fromJson(dynamic value) => AssetSortFieldTypeTransformer().decode(value);

  static List<AssetSortField> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetSortField>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetSortField.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetSortField] to String,
/// and [decode] dynamic data back to [AssetSortField].
class AssetSortFieldTypeTransformer {
  factory AssetSortFieldTypeTransformer() => _instance ??= const AssetSortFieldTypeTransformer._();

  const AssetSortFieldTypeTransformer._();

  String encode(AssetSortField data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetSortField.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetSortField? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'date': return AssetSortField.date;
        case r'size': return AssetSortField.size;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetSortFieldTypeTransformer] instance.
  static AssetSortFieldTypeTransformer? _instance;
}

