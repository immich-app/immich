//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetVisibility {
  /// Instantiate a new enum with the provided [value].
  const AssetVisibility._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const archive = AssetVisibility._(r'archive');
  static const timeline = AssetVisibility._(r'timeline');
  static const hidden = AssetVisibility._(r'hidden');
  static const locked = AssetVisibility._(r'locked');

  /// List of all possible values in this [enum][AssetVisibility].
  static const values = <AssetVisibility>[
    archive,
    timeline,
    hidden,
    locked,
  ];

  static AssetVisibility? fromJson(dynamic value) => AssetVisibilityTypeTransformer().decode(value);

  static List<AssetVisibility> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetVisibility>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetVisibility.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetVisibility] to String,
/// and [decode] dynamic data back to [AssetVisibility].
class AssetVisibilityTypeTransformer {
  factory AssetVisibilityTypeTransformer() => _instance ??= const AssetVisibilityTypeTransformer._();

  const AssetVisibilityTypeTransformer._();

  String encode(AssetVisibility data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetVisibility.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetVisibility? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'archive': return AssetVisibility.archive;
        case r'timeline': return AssetVisibility.timeline;
        case r'hidden': return AssetVisibility.hidden;
        case r'locked': return AssetVisibility.locked;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetVisibilityTypeTransformer] instance.
  static AssetVisibilityTypeTransformer? _instance;
}

