//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetEditAction {
  /// Instantiate a new enum with the provided [value].
  const AssetEditAction._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const crop = AssetEditAction._(r'crop');
  static const rotate = AssetEditAction._(r'rotate');
  static const mirror = AssetEditAction._(r'mirror');

  /// List of all possible values in this [enum][AssetEditAction].
  static const values = <AssetEditAction>[
    crop,
    rotate,
    mirror,
  ];

  static AssetEditAction? fromJson(dynamic value) => AssetEditActionTypeTransformer().decode(value);

  static List<AssetEditAction> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditAction>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditAction.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetEditAction] to String,
/// and [decode] dynamic data back to [AssetEditAction].
class AssetEditActionTypeTransformer {
  factory AssetEditActionTypeTransformer() => _instance ??= const AssetEditActionTypeTransformer._();

  const AssetEditActionTypeTransformer._();

  String encode(AssetEditAction data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetEditAction.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetEditAction? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'crop': return AssetEditAction.crop;
        case r'rotate': return AssetEditAction.rotate;
        case r'mirror': return AssetEditAction.mirror;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetEditActionTypeTransformer] instance.
  static AssetEditActionTypeTransformer? _instance;
}

