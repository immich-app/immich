//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Asset visibility
enum AssetVisibility {
  archive._(r'archive'),
  timeline._(r'timeline'),
  hidden._(r'hidden'),
  locked._(r'locked'),
  ;

  /// Instantiate a new enum with the provided value.
  const AssetVisibility._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [AssetVisibility] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static AssetVisibility? fromJson(dynamic value) => AssetVisibilityTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [AssetVisibility]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(AssetVisibility data) => data._value;

  /// Returns the instance of [AssetVisibility] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetVisibility? decode(dynamic data, {bool allowNull = true}) {
    if (data is AssetVisibility) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static AssetVisibilityTypeTransformer? _instance;
}

