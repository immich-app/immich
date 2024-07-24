//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetOrder {
  /// Instantiate a new enum with the provided [value].
  const AssetOrder._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asc = AssetOrder._(r'asc');
  static const desc = AssetOrder._(r'desc');

  /// List of all possible values in this [enum][AssetOrder].
  static const values = <AssetOrder>[
    asc,
    desc,
  ];

  static AssetOrder? fromJson(dynamic value) => AssetOrderTypeTransformer().decode(value);

  static List<AssetOrder> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetOrder>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetOrder.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetOrder] to String,
/// and [decode] dynamic data back to [AssetOrder].
class AssetOrderTypeTransformer {
  factory AssetOrderTypeTransformer() => _instance ??= const AssetOrderTypeTransformer._();

  const AssetOrderTypeTransformer._();

  String encode(AssetOrder data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetOrder.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetOrder? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asc': return AssetOrder.asc;
        case r'desc': return AssetOrder.desc;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetOrderTypeTransformer] instance.
  static AssetOrderTypeTransformer? _instance;
}

