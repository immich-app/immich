//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetMediaStatus {
  /// Instantiate a new enum with the provided [value].
  const AssetMediaStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const created = AssetMediaStatus._(r'created');
  static const replaced = AssetMediaStatus._(r'replaced');
  static const duplicate = AssetMediaStatus._(r'duplicate');

  /// List of all possible values in this [enum][AssetMediaStatus].
  static const values = <AssetMediaStatus>[
    created,
    replaced,
    duplicate,
  ];

  static AssetMediaStatus? fromJson(dynamic value) => AssetMediaStatusTypeTransformer().decode(value);

  static List<AssetMediaStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetMediaStatus] to String,
/// and [decode] dynamic data back to [AssetMediaStatus].
class AssetMediaStatusTypeTransformer {
  factory AssetMediaStatusTypeTransformer() => _instance ??= const AssetMediaStatusTypeTransformer._();

  const AssetMediaStatusTypeTransformer._();

  String encode(AssetMediaStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetMediaStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetMediaStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'created': return AssetMediaStatus.created;
        case r'replaced': return AssetMediaStatus.replaced;
        case r'duplicate': return AssetMediaStatus.duplicate;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetMediaStatusTypeTransformer] instance.
  static AssetMediaStatusTypeTransformer? _instance;
}

