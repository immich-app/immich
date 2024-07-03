//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetMediaSize {
  /// Instantiate a new enum with the provided [value].
  const AssetMediaSize._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const preview = AssetMediaSize._(r'preview');
  static const thumbnail = AssetMediaSize._(r'thumbnail');

  /// List of all possible values in this [enum][AssetMediaSize].
  static const values = <AssetMediaSize>[
    preview,
    thumbnail,
  ];

  static AssetMediaSize? fromJson(dynamic value) => AssetMediaSizeTypeTransformer().decode(value);

  static List<AssetMediaSize> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaSize>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaSize.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetMediaSize] to String,
/// and [decode] dynamic data back to [AssetMediaSize].
class AssetMediaSizeTypeTransformer {
  factory AssetMediaSizeTypeTransformer() => _instance ??= const AssetMediaSizeTypeTransformer._();

  const AssetMediaSizeTypeTransformer._();

  String encode(AssetMediaSize data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetMediaSize.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetMediaSize? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'preview': return AssetMediaSize.preview;
        case r'thumbnail': return AssetMediaSize.thumbnail;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetMediaSizeTypeTransformer] instance.
  static AssetMediaSizeTypeTransformer? _instance;
}

