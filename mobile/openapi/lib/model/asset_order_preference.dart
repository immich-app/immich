//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetOrderPreference {
  /// Instantiate a new enum with the provided [value].
  const AssetOrderPreference._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asc = AssetOrderPreference._(r'asc');
  static const desc = AssetOrderPreference._(r'desc');

  /// List of all possible values in this [enum][AssetOrderPreference].
  static const values = <AssetOrderPreference>[
    asc,
    desc,
  ];

  static AssetOrderPreference? fromJson(dynamic value) => AssetOrderPreferenceTypeTransformer().decode(value);

  static List<AssetOrderPreference> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetOrderPreference>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetOrderPreference.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetOrderPreference] to String,
/// and [decode] dynamic data back to [AssetOrderPreference].
class AssetOrderPreferenceTypeTransformer {
  factory AssetOrderPreferenceTypeTransformer() => _instance ??= const AssetOrderPreferenceTypeTransformer._();

  const AssetOrderPreferenceTypeTransformer._();

  String encode(AssetOrderPreference data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetOrderPreference.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetOrderPreference? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asc': return AssetOrderPreference.asc;
        case r'desc': return AssetOrderPreference.desc;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetOrderPreferenceTypeTransformer] instance.
  static AssetOrderPreferenceTypeTransformer? _instance;
}

